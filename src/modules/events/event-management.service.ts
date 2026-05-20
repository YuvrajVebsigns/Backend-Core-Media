import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventManagement, EventStatus } from './schemas/event.schema';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventManagementService {
  constructor(
    @InjectModel(EventManagement.name) private eventModel: Model<EventManagement>,
  ) { }

  async create(createEventDto: CreateEventDto): Promise<EventManagement> {
    const existing = await this.eventModel.findOne({ slug: createEventDto.slug }).exec();
    if (existing) {
      throw new ConflictException(`Event with slug ${createEventDto.slug} already exists`);
    }
    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async findAll(filters: { websiteId?: string; status?: EventStatus } = {}): Promise<EventManagement[]> {
    const query: any = {};

    if (filters.websiteId) {
      query.websites = filters.websiteId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    return this.eventModel
      .find(query)
      .populate('websites')
      .populate('sponsors')
      .sort({ startDate: 1 })
      .exec();
  }

  async findOne(id: string): Promise<EventManagement> {
    const event = await this.eventModel
      .findById(id)
      .populate('websites')
      .populate('sponsors')
      .exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async findBySlug(slug: string): Promise<EventManagement> {
    const event = await this.eventModel
      .findOne({ slug })
      .populate('websites')
      .populate('sponsors')
      .exec();
    if (!event) {
      throw new NotFoundException(`Event with slug ${slug} not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<EventManagement> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return updatedEvent;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel.findByIdAndUpdate(id, { isDeleted: true }).exec();
    if (!result) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }
}
