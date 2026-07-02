import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sponsor } from './schemas/sponsor.schema';
import {
  CreateSponsorDto,
  UpdateSponsorDto,
  QuerySponsorDto,
} from './dto/sponsor.dto';
import { UrlService } from '@core/files/services/url.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AppEvents,
  SponsorCreatedEvent,
  SponsorUpdatedEvent,
  SponsorDeletedEvent,
} from '@modules/events/event-definitions';

const IMAGE_POPULATE_SELECT = '_id metadata key variants';

@Injectable()
export class SponsorsService {
  constructor(
    @InjectModel(Sponsor.name) private sponsorModel: Model<Sponsor>,
    private readonly urlService: UrlService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Transform populated File references into lean image objects
   */
  private transformImageFields(sponsor: any): any {
    if (!sponsor) return sponsor;

    const obj = sponsor.toJSON ? sponsor.toJSON() : { ...sponsor };

    // Transform logoId — only if it was actually populated (has 'key')
    if (obj.logoId && typeof obj.logoId === 'object' && obj.logoId.key) {
      const file = obj.logoId;
      const url = this.urlService.getPublicUrl(file.key);
      const urlVariants = file.variants
        ? this.urlService.getVariantUrls(file.variants)
        : {};

      obj.logoId = {
        id: file.id || file._id,
        metadata: file.metadata || {},
        url,
        urlVariants,
      };

      // Enrich logo with variant URLs
      obj.logo = {
        original: url,
        ...urlVariants,
      };
    }

    return obj;
  }

  private sanitizeImageUrls(dto: any) {
    if (
      dto.logoId &&
      typeof dto.logo === 'string' &&
      dto.logo?.startsWith('http')
    ) {
      delete dto.logo;
    }
  }

  private buildMatchQuery(queryDto: QuerySponsorDto): any {
    const { search, type, tier, isActive, websiteId } = queryDto;
    const matchQuery: any = {};

    if (isActive !== undefined) {
      matchQuery.isActive = isActive;
    }

    if (type) {
      matchQuery.type = type;
    }

    if (tier) {
      matchQuery.tier = tier;
    }

    if (websiteId) {
      matchQuery.websites = { $in: [websiteId] };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      matchQuery.$or = [
        { name: searchRegex },
        { companyName: searchRegex },
        { email: searchRegex },
        { description: searchRegex },
      ];
    }

    return matchQuery;
  }

  private buildSortOption(sort?: string): any {
    const sortOption: any = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption.sortOrder = 1;
      sortOption.createdAt = -1;
    }
    return sortOption;
  }

  async create(createDto: CreateSponsorDto): Promise<Sponsor> {
    this.sanitizeImageUrls(createDto);
    const sponsor = new this.sponsorModel(createDto);
    const saved = await sponsor.save();

    this.eventEmitter.emit(
      AppEvents.SPONSOR_CREATED,
      new SponsorCreatedEvent(saved._id.toString(), saved.name),
    );

    return saved;
  }

  async findAll(queryDto: QuerySponsorDto) {
    const { page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;
    const matchQuery = this.buildMatchQuery(queryDto);
    const sortOption = this.buildSortOption(queryDto.sort);

    const [rawData, total] = await Promise.all([
      this.sponsorModel
        .find(matchQuery)
        .populate('logoId', IMAGE_POPULATE_SELECT)
        .populate('websites', 'name domain logo')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.sponsorModel.countDocuments(matchQuery).exec(),
    ]);

    const data = rawData.map((sponsor) => this.transformImageFields(sponsor));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForWebsite(queryDto: QuerySponsorDto) {
    const { page = 1, limit = 50 } = queryDto;
    const skip = (page - 1) * limit;
    const matchQuery = this.buildMatchQuery(queryDto);
    const sortOption = this.buildSortOption(queryDto.sort);

    const summaryProjection = {
      name: 1,
      companyName: 1,
      logo: 1,
      logoId: 1,
      website: 1,
      type: 1,
      tier: 1,
      description: 1,
      socialLinks: 1,
      designation: 1,
      sortOrder: 1,
    };

    const [rawData, total] = await Promise.all([
      this.sponsorModel
        .find(matchQuery, summaryProjection)
        .populate('logoId', IMAGE_POPULATE_SELECT)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.sponsorModel.countDocuments(matchQuery).exec(),
    ]);

    const data = rawData.map((sponsor) => this.transformImageFields(sponsor));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<any> {
    const sponsor = await this.sponsorModel
      .findById(id)
      .populate('logoId', IMAGE_POPULATE_SELECT)
      .populate('websites', 'name domain logo')
      .exec();
    if (!sponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }
    return this.transformImageFields(sponsor);
  }

  async update(id: string, updateDto: UpdateSponsorDto): Promise<any> {
    this.sanitizeImageUrls(updateDto);

    const sponsor = await this.sponsorModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('logoId', IMAGE_POPULATE_SELECT)
      .populate('websites', 'name domain logo')
      .exec();
    if (!sponsor) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }

    this.eventEmitter.emit(
      AppEvents.SPONSOR_UPDATED,
      new SponsorUpdatedEvent(sponsor._id.toString(), sponsor.name),
    );

    return this.transformImageFields(sponsor);
  }

  async remove(id: string): Promise<void> {
    const result = await this.sponsorModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();
    if (!result) {
      throw new NotFoundException(`Sponsor with ID ${id} not found`);
    }

    this.eventEmitter.emit(
      AppEvents.SPONSOR_DELETED,
      new SponsorDeletedEvent(result._id.toString()),
    );
  }
}
