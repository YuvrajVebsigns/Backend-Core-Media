import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MessageTemplate } from '../schemas/message-template.schema';
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  QueryMessageTemplateDto,
} from '../dto/message-template.dto';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { BrevoEmailProvider } from '../providers/brevo-email.provider';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { CommunicationChannel } from '../schemas/communication-log.schema';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectModel(MessageTemplate.name)
    private readonly templateModel: Model<MessageTemplate>,
    private readonly providerRegistry: ProviderRegistryService,
  ) {}

  async create(dto: CreateMessageTemplateDto): Promise<MessageTemplate> {
    const existing = await this.templateModel.findOne({ slug: dto.slug, isDeleted: null }).exec();
    if (existing) {
      throw new ConflictException(`Template with slug "${dto.slug}" already exists.`);
    }

    const template = new this.templateModel(dto);
    const saved = await template.save();

    // Auto-sync to Brevo if email channel
    if (saved.channel === CommunicationChannel.EMAIL) {
      await this.syncToBrevo(saved);
    }

    return saved;
  }

  async findAll(queryDto: QueryMessageTemplateDto): Promise<PaginatedResponseDto<MessageTemplate>> {
    const { page = 1, limit = 10, search, channel, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (channel) {
      matchQuery.channel = channel;
    }

    if (isActive !== undefined) {
      matchQuery.isActive = isActive;
    }

    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.templateModel
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.templateModel.countDocuments(matchQuery).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<MessageTemplate> {
    const template = await this.templateModel.findOne({ _id: id, isDeleted: null }).exec();
    if (!template) {
      throw new NotFoundException(`Message template with ID ${id} not found.`);
    }
    return template;
  }

  async findBySlug(slug: string): Promise<MessageTemplate> {
    const template = await this.templateModel.findOne({ slug, isDeleted: null }).exec();
    if (!template) {
      throw new NotFoundException(`Message template with slug "${slug}" not found.`);
    }
    return template;
  }

  async update(id: string, dto: UpdateMessageTemplateDto): Promise<MessageTemplate> {
    const template = await this.findOne(id);

    if (dto.slug && dto.slug !== template.slug) {
      const existing = await this.templateModel.findOne({ slug: dto.slug, isDeleted: null }).exec();
      if (existing) {
        throw new ConflictException(`Template with slug "${dto.slug}" already exists.`);
      }
    }

    Object.assign(template, dto);
    const updated = await template.save();

    // Re-sync to Brevo if email channel
    if (updated.channel === CommunicationChannel.EMAIL) {
      await this.syncToBrevo(updated);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    template.isDeleted = new Date();
    await template.save();

    // Soft-delete or deactivate on Brevo if it exists
    if (template.channel === CommunicationChannel.EMAIL && template.providerSync?.brevo?.templateId) {
      try {
        const brevoProvider = this.providerRegistry.getProvider('brevo') as BrevoEmailProvider;
        const brevoClient = brevoProvider.getClient();
        if (brevoClient) {
          await brevoClient.transactionalEmails.deleteSmtpTemplate({
            templateId: template.providerSync.brevo.templateId,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to delete template from Brevo: ${error.message}`);
      }
    }
  }

  /**
   * Pushes a local template to Brevo's Transactional Email templates API
   */
  async syncToBrevo(template: MessageTemplate): Promise<void> {
    try {
      const brevoProvider = this.providerRegistry.getProvider('brevo') as BrevoEmailProvider;
      const brevoClient = brevoProvider.getClient();
      if (!brevoClient) {
        this.logger.warn('Brevo client is not initialized. Skipping template sync.');
        return;
      }

      // Check if we have standard sender setup in credentials
      const defaultEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@coremediagroup.com';
      const defaultName = process.env.BREVO_SENDER_NAME || 'Core Media';

      const templateId = template.providerSync?.brevo?.templateId;

      if (templateId) {
        // Update existing Brevo template
        this.logger.debug(`Updating template ${template.slug} on Brevo (Template ID: ${templateId})`);
        await brevoClient.transactionalEmails.updateSmtpTemplate({
          templateId,
          templateName: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          isActive: template.isActive,
          sender: { name: defaultName, email: defaultEmail },
        });

        template.providerSync = {
          ...template.providerSync,
          brevo: {
            templateId,
            syncedAt: new Date(),
            syncStatus: 'synced',
            error: null,
          },
        };
      } else {
        // Create new Brevo template
        this.logger.debug(`Creating new template ${template.slug} on Brevo`);
        const res = await brevoClient.transactionalEmails.createSmtpTemplate({
          templateName: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          isActive: template.isActive,
          sender: { name: defaultName, email: defaultEmail },
        });

        if (res.id) {
          template.providerSync = {
            ...template.providerSync,
            brevo: {
              templateId: res.id,
              syncedAt: new Date(),
              syncStatus: 'synced',
              error: null,
            },
          };
        }
      }

      // Bypass middleware to save updated sync state
      await this.templateModel.updateOne(
        { _id: template._id },
        { providerSync: template.providerSync },
      );
      this.logger.log(`Synced template "${template.slug}" to Brevo successfully.`);
    } catch (error) {
      this.logger.error(`Error syncing template "${template.slug}" to Brevo: ${error.message}`);
      template.providerSync = {
        ...template.providerSync,
        brevo: {
          templateId: template.providerSync?.brevo?.templateId,
          syncedAt: new Date(),
          syncStatus: 'failed',
          error: error.message,
        },
      };
      await this.templateModel.updateOne(
        { _id: template._id },
        { providerSync: template.providerSync },
      );
    }
  }

  /**
   * Syncs a template FROM Brevo SMTP templates to local DB
   */
  async syncFromBrevo(brevoTemplateId: number): Promise<MessageTemplate> {
    try {
      const brevoProvider = this.providerRegistry.getProvider('brevo') as BrevoEmailProvider;
      const brevoClient = brevoProvider.getClient();
      if (!brevoClient) {
        throw new Error('Brevo client is not initialized.');
      }

      this.logger.debug(`Fetching template ${brevoTemplateId} from Brevo API`);
      const brevoTemplate = await brevoClient.transactionalEmails.getSmtpTemplate({
        templateId: brevoTemplateId,
      });

      if (!brevoTemplate) {
        throw new NotFoundException(`Template with ID ${brevoTemplateId} not found on Brevo.`);
      }

      // Try to find matching local template by brevo.templateId
      let template = await this.templateModel.findOne({
        'providerSync.brevo.templateId': brevoTemplateId,
        isDeleted: null,
      }).exec();

      const templateData = {
        name: brevoTemplate.name,
        subject: brevoTemplate.subject,
        htmlContent: brevoTemplate.htmlContent || '',
        isActive: brevoTemplate.isActive || true,
        channel: CommunicationChannel.EMAIL,
        providerSync: {
          brevo: {
            templateId: brevoTemplateId,
            syncedAt: new Date(),
            syncStatus: 'synced' as const,
            error: null,
          },
        },
      };

      if (template) {
        Object.assign(template, templateData);
        await template.save();
        this.logger.log(`Updated template "${template.slug}" from Brevo Template ID ${brevoTemplateId}`);
      } else {
        // Create new template locally
        const slug = `brevo-sync-${brevoTemplateId}`;
        template = new this.templateModel({
          ...templateData,
          slug,
        });
        await template.save();
        this.logger.log(`Created new template "${slug}" from Brevo Template ID ${brevoTemplateId}`);
      }

      return template;
    } catch (error) {
      this.logger.error(`Error syncing template ${brevoTemplateId} from Brevo: ${error.message}`);
      throw error;
    }
  }
}
