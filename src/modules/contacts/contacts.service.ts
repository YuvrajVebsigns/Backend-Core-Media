import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Contact, ContactStatus } from './schemas/contact.schema';
import {
  CreateContactDto,
  ReplyContactDto,
  QueryContactDto,
} from './dto/contact.dto';
import {
  ContactSubmittedEvent,
  ContactRepliedEvent,
  AppEvents,
} from '@modules/events/event-definitions';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private readonly contactModel: Model<Contact>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Public contact submission
   */
  async create(createDto: CreateContactDto, websiteId: string): Promise<Contact> {
    const contact = new this.contactModel({
      ...createDto,
      websiteId: new Types.ObjectId(websiteId),
      status: ContactStatus.PENDING,
    });
    const saved = await contact.save();

    this.eventEmitter.emit(
      AppEvents.CONTACT_SUBMITTED,
      new ContactSubmittedEvent(
        saved._id.toString(),
        saved.fullName,
        saved.email,
        saved.phone,
        saved.service,
        saved.message,
        websiteId,
      ),
    );

    return saved;
  }

  /**
   * Find all contact submissions with filtering and pagination
   */
  async findAll(queryDto: QueryContactDto) {
    const { page = 1, limit = 10, search, status, websiteId } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = {};

    if (status) {
      matchQuery.status = status;
    }

    if (websiteId) {
      matchQuery.websiteId = new Types.ObjectId(websiteId);
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      matchQuery.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { message: searchRegex },
        { replyMessage: searchRegex },
      ];
    }

    const [rawData, total] = await Promise.all([
      this.contactModel
        .find(matchQuery)
        .populate('websiteId', 'name domain logo')
        .populate('repliedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(matchQuery).exec(),
    ]);

    return {
      data: rawData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single submission
   */
  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactModel
      .findById(id)
      .populate('websiteId', 'name domain logo')
      .populate('repliedBy', 'firstName lastName email')
      .exec();

    if (!contact) {
      throw new NotFoundException(`Contact submission with ID ${id} not found`);
    }

    return contact;
  }

  /**
   * Save a reply response to the contact submission
   */
  async reply(
    id: string,
    replyDto: ReplyContactDto,
    userId: string,
  ): Promise<Contact> {
    const contact = await this.contactModel.findById(id).exec();

    if (!contact) {
      throw new NotFoundException(`Contact submission with ID ${id} not found`);
    }

    contact.replyMessage = replyDto.replyMessage;
    contact.status = ContactStatus.REPLIED;
    contact.repliedAt = new Date();
    contact.repliedBy = new Types.ObjectId(userId) as any;

    await contact.save();

    this.eventEmitter.emit(
      AppEvents.CONTACT_REPLIED,
      new ContactRepliedEvent(
        contact._id.toString(),
        contact.email,
        userId,
      ),
    );

    return this.findOne(id);
  }

  /**
   * Soft delete a submission
   */
  async remove(id: string): Promise<void> {
    const result = await this.contactModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();

    if (!result) {
      throw new NotFoundException(`Contact submission with ID ${id} not found`);
    }
  }
}
