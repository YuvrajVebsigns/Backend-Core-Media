import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Subscribe } from './schemas/subscribe.schema';
import {
  CreateSubscribeDto,
  QuerySubscribeDto,
  SendSelectedSubscribersDto,
} from './dto/subscribe.dto';
import { CommunicationsService } from '@modules/communications/communications.service';
import {
  AppEvents,
  SubscriberBulkEmailSentEvent,
  SubscriberSubscribedEvent,
} from '@modules/events/event-definitions';

@Injectable()
export class SubscribesService {
  private readonly logger = new Logger(SubscribesService.name);

  constructor(
    @InjectModel(Subscribe.name) private readonly subscribeModel: Model<Subscribe>,
    private readonly communicationsService: CommunicationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createDto: CreateSubscribeDto, websiteId: string): Promise<Subscribe> {
    const matchQuery: any = {
      email: createDto.email,
      websiteId: new Types.ObjectId(websiteId),
    };
    const existing = await this.subscribeModel.findOne(matchQuery).exec();
    if (existing) {
      this.logger.log(`⚠️  Subscriber already exists: ${createDto.email} for website: ${websiteId}`);
      return existing;
    }

    const doc = new this.subscribeModel({
      email: createDto.email,
      source: createDto.source,
      websiteId: new Types.ObjectId(websiteId),
      subscribedAt: new Date(),
    });

    const saved = await doc.save();

    this.logger.log(
      `✅ New subscriber created: ${saved.email} (ID: ${saved._id}) for website: ${websiteId}`,
    );

    this.eventEmitter.emit(
      AppEvents.SUBSCRIBER_SUBSCRIBED,
      new SubscriberSubscribedEvent(
        saved._id.toString(),
        saved.email,
        websiteId,
        saved.source || 'website',
        saved.subscribedAt || new Date(),
      ),
    );

    this.logger.log(
      `📤 Emitted SUBSCRIBER_SUBSCRIBED event for: ${saved.email} (website: ${websiteId})`,
    );

    return saved;
  }

  async findAll(queryDto: QuerySubscribeDto) {
    const { page = 1, limit = 10, search, websiteId } = queryDto as any;
    const skip = (page - 1) * limit;

    const matchQuery: any = {};
    if (websiteId) matchQuery.websiteId = new Types.ObjectId(websiteId);
    if (search) matchQuery.email = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      this.subscribeModel
        .find(matchQuery)
        .populate('websiteId', 'name domain')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.subscribeModel.countDocuments(matchQuery).exec(),
    ]);

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

  async findOne(id: string): Promise<Subscribe> {
    const sub = await this.subscribeModel.findById(id).populate('websiteId', 'name domain').exec();
    if (!sub) throw new NotFoundException(`Subscribe entry with ID ${id} not found`);
    return sub;
  }

  async remove(id: string): Promise<void> {
    const result = await this.subscribeModel.findByIdAndUpdate(id, { isDeleted: new Date() }).exec();
    if (!result) throw new NotFoundException(`Subscribe entry with ID ${id} not found`);
  }

  async sendSelectedEmails(dto: SendSelectedSubscribersDto) {
    const { subscriberIds, subject, content, websiteId } = dto;

    const validSubscriberIds = subscriberIds.filter((id) => Types.ObjectId.isValid(id));
    const query: any = {
      _id: { $in: validSubscriberIds.map((id) => new Types.ObjectId(id)) },
    };

    if (websiteId && Types.ObjectId.isValid(websiteId)) {
      query.websiteId = new Types.ObjectId(websiteId);
    }

    const subscribers = await this.subscribeModel.find(query).exec();

    const emails = subscribers
      .map((subscriber) => subscriber.email)
      .filter((email): email is string => !!email && typeof email === 'string')
      .map((email) => email.trim().toLowerCase())
      .filter((email, index, array) => array.indexOf(email) === index);

    const sentResults: string[] = [];

    for (const email of emails) {
      await this.communicationsService.sendEmail(email, subject, content, {
        source: 'selected-subscribers',
        subscriberIds: validSubscriberIds,
      });
      sentResults.push(email);
    }

    this.eventEmitter.emit(
      AppEvents.SUBSCRIBER_BULK_EMAIL_SENT,
      new SubscriberBulkEmailSentEvent(
        websiteId && Types.ObjectId.isValid(websiteId) ? websiteId : undefined,
        subject,
        sentResults.length,
        sentResults,
      ),
    );

    return {
      totalRequested: validSubscriberIds.length,
      totalSent: sentResults.length,
      sentEmails: sentResults,
      failedEmails: [],
    };
  }
}
