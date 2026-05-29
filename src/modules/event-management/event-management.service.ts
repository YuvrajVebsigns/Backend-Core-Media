import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from './schemas/event.schema';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<Event>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const existing = await this.eventModel
      .findOne({ slug: createEventDto.slug })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Event with slug ${createEventDto.slug} already exists`,
      );
    }
    const createdEvent = new this.eventModel(createEventDto);
    const savedEvent = await createdEvent.save();
    return this.findOne(savedEvent._id.toString());
  }

  async findAll(
    filters: { websiteId?: string; status?: EventStatus } = {},
  ): Promise<Event[]> {
    const query: any = {};

    if (filters.websiteId) {
      query.websites = filters.websiteId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const events = await this.eventModel
      .find(query)
      .populate('websites')
      .populate('sponsors')
      .sort({ startDate: 1 })
      .exec();

    const eventsWithRegistrations = await Promise.all(
      events.map(async (event) => {
        let totalRegistrations = 0;
        try {
          const attendeeModel = this.eventModel.db.model('Attendee');
          totalRegistrations = await attendeeModel
            .countDocuments({ eventId: event._id })
            .exec();
        } catch (e) {
          // Model not compiled yet fallback
        }

        const eventJson = event.toJSON();
        eventJson.totalRegistrations = totalRegistrations;
        return eventJson;
      }),
    );

    return eventsWithRegistrations as any;
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('websites')
      .populate('sponsors')
      .exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    let totalRegistrations = 0;
    try {
      const attendeeModel = this.eventModel.db.model('Attendee');
      totalRegistrations = await attendeeModel
        .countDocuments({ eventId: event._id })
        .exec();
    } catch (e) {
      // Model not compiled fallback
    }

    const eventJson = event.toJSON();
    eventJson.totalRegistrations = totalRegistrations;
    return eventJson as any;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.eventModel
      .findOne({ slug })
      .populate('websites')
      .populate('sponsors')
      .exec();
    if (!event) {
      throw new NotFoundException(`Event with slug ${slug} not found`);
    }

    let totalRegistrations = 0;
    try {
      const attendeeModel = this.eventModel.db.model('Attendee');
      totalRegistrations = await attendeeModel
        .countDocuments({ eventId: event._id })
        .exec();
    } catch (e) {
      // Model not compiled fallback
    }

    const eventJson = event.toJSON();
    eventJson.totalRegistrations = totalRegistrations;
    return eventJson as any;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .populate('websites')
      .populate('sponsors')
      .exec();
    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    let totalRegistrations = 0;
    try {
      const attendeeModel = this.eventModel.db.model('Attendee');
      totalRegistrations = await attendeeModel
        .countDocuments({ eventId: updatedEvent._id })
        .exec();
    } catch (e) {
      // Model not compiled fallback
    }

    const eventJson = updatedEvent.toJSON();
    eventJson.totalRegistrations = totalRegistrations;
    return eventJson as any;
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();
    if (!result) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }
}
