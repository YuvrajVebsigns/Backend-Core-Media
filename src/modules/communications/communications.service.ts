import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  CommunicationLog,
  CommunicationChannel,
  CommunicationStatus,
} from './schemas/communication-log.schema';
import { WebhookSubscription } from './schemas/webhook-subscription.schema';
import {
  QueryCommunicationLogDto,
  SendManualMessageDto,
} from './dto/communication-log.dto';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
  QueryWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    @InjectModel(CommunicationLog.name)
    private readonly logModel: Model<CommunicationLog>,
    @InjectModel(WebhookSubscription.name)
    private readonly webhookSubscriptionModel: Model<WebhookSubscription>,
    @InjectQueue('communications')
    private readonly communicationsQueue: Queue,
  ) {}

  /**
   * Helper to dispatch any notification type through the background queue.
   * Creates a pending log first and pushes a delivery job.
   */
  async dispatch(
    channel: CommunicationChannel,
    recipient: string,
    title: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<CommunicationLog> {
    const log = new this.logModel({
      channel,
      recipient,
      title,
      content,
      status: CommunicationStatus.PENDING,
      metadata: metadata || {},
    });
    const savedLog = await log.save();

    await this.communicationsQueue.add(
      `send-${channel}`,
      {
        logId: savedLog._id.toString(),
        channel,
        recipient,
        title,
        content,
        metadata: metadata || {},
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.debug(
      `Dispatched CommunicationLog: ${savedLog._id} [Channel: ${channel}, Recipient: ${recipient}]`,
    );

    return savedLog;
  }

  // Internal high-level APIs
  async sendEmail(to: string, subject: string, body: string, metadata?: Record<string, any>) {
    return this.dispatch(CommunicationChannel.EMAIL, to, subject, body, metadata);
  }

  async sendSms(to: string, message: string, metadata?: Record<string, any>) {
    return this.dispatch(CommunicationChannel.SMS, to, '', message, metadata);
  }

  async sendPush(token: string, title: string, body: string, metadata?: Record<string, any>) {
    return this.dispatch(CommunicationChannel.PUSH, token, title, body, metadata);
  }

  /**
   * Triggers active webhook subscriptions that match a given system event name (or * wildcard).
   */
  async triggerWebhook(event: string, payload: any) {
    const subscriptions = await this.webhookSubscriptionModel
      .find({ isActive: true, isDeleted: null })
      .exec();

    const matchedSubs = subscriptions.filter(
      (sub) => sub.events.includes('*') || sub.events.includes(event),
    );

    this.logger.debug(
      `Triggering webhook for event "${event}". Found ${matchedSubs.length} matching subscriptions.`,
    );

    for (const sub of matchedSubs) {
      await this.dispatch(
        CommunicationChannel.WEBHOOK,
        sub.url,
        event,
        JSON.stringify(payload),
        {
          webhookSubscriptionId: sub._id.toString(),
          secret: sub.secret,
          event,
        },
      );
    }
  }

  // Admin APIs: Communication Logs
  async findAllLogs(
    queryDto: QueryCommunicationLogDto,
  ): Promise<PaginatedResponseDto<CommunicationLog>> {
    const { page = 1, limit = 10, search, channel, status } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (channel) {
      matchQuery.channel = channel;
    }

    if (status) {
      matchQuery.status = status;
    }

    if (search) {
      matchQuery.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.logModel
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.logModel.countDocuments(matchQuery).exec(),
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

  async findOneLog(id: string): Promise<CommunicationLog> {
    const log = await this.logModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!log) {
      throw new NotFoundException(`Communication log with ID ${id} not found`);
    }
    return log;
  }

  // Admin APIs: Webhook Subscriptions
  async createWebhookSubscription(
    dto: CreateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    const sub = new this.webhookSubscriptionModel(dto);
    return sub.save();
  }

  async findAllWebhookSubscriptions(
    queryDto: QueryWebhookSubscriptionDto,
  ): Promise<PaginatedResponseDto<WebhookSubscription>> {
    const { page = 1, limit = 10, search, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (isActive !== undefined) {
      matchQuery.isActive = isActive;
    }

    if (search) {
      matchQuery.url = { $regex: search, $options: 'i' };
    }

    const [data, total] = await Promise.all([
      this.webhookSubscriptionModel
        .find(matchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.webhookSubscriptionModel.countDocuments(matchQuery).exec(),
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

  async findOneWebhookSubscription(id: string): Promise<WebhookSubscription> {
    const sub = await this.webhookSubscriptionModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!sub) {
      throw new NotFoundException(`Webhook subscription with ID ${id} not found`);
    }
    return sub;
  }

  async updateWebhookSubscription(
    id: string,
    dto: UpdateWebhookSubscriptionDto,
  ): Promise<WebhookSubscription> {
    const sub = await this.webhookSubscriptionModel
      .findOneAndUpdate({ _id: id, isDeleted: null }, dto, {
        new: true,
      })
      .exec();

    if (!sub) {
      throw new NotFoundException(`Webhook subscription with ID ${id} not found`);
    }
    return sub;
  }

  async removeWebhookSubscription(id: string): Promise<void> {
    const result = await this.webhookSubscriptionModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Webhook subscription with ID ${id} not found`);
    }
  }
}
