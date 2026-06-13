import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventStatus, EventType } from './schemas/event.schema';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventMeeting } from './schemas/event-meeting.schema';
import { CreateEventMeetingDto, UpdateEventMeetingDto } from './dto/event-meeting.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<Event>,
    @InjectModel(EventMeeting.name)
    private eventMeetingModel: Model<EventMeeting>,
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
    filters: {
      websiteId?: string;
      status?: EventStatus;
      page?: number;
      limit?: number;
      search?: string;
      type?: EventType;
    } = {},
  ): Promise<any> {
    const query: any = {};

    if (filters.websiteId) {
      query.websites = filters.websiteId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { slug: searchRegex },
        { excerpt: searchRegex },
        { 'location.city': searchRegex },
        { 'location.address': searchRegex },
      ];
    }

    // Default to active events
    query.isActive = { $ne: false };

    // If page & limit are specified, return paginated results
    if (filters.page && filters.limit) {
      const page = Math.max(1, Number(filters.page));
      const limit = Math.max(1, Number(filters.limit));
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        this.eventModel
          .find(query)
          .populate('websites')
          .populate('sponsors')
          .sort({ startDate: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.eventModel.countDocuments(query).exec(),
      ]);

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

      return {
        data: eventsWithRegistrations,
        total,
        page,
        limit,
      };
    }

    // Otherwise, return traditional flat array (fully backwards-compatible)
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

    return eventsWithRegistrations;
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

  async createMeeting(eventId: string, createDto: CreateEventMeetingDto): Promise<EventMeeting> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    const createdMeeting = new this.eventMeetingModel({
      ...createDto,
      eventId,
    });
    const savedMeeting = await createdMeeting.save();
    return this.findMeetingById(savedMeeting._id.toString());
  }

  async findMeetingsByEvent(eventId: string): Promise<EventMeeting[]> {
    return this.eventMeetingModel
      .find({ eventId: new Types.ObjectId(eventId), isDeleted: null } as any)
      .populate('attendeeIds')
      .populate('sponsorId')
      .sort({ createdAt: 1 })
      .exec();
  }

  async findMeetingById(meetingId: string): Promise<EventMeeting> {
    const meeting = await this.eventMeetingModel
      .findById(meetingId)
      .populate('attendeeIds')
      .populate('sponsorId')
      .exec();
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
    }
    return meeting;
  }

  async updateMeeting(meetingId: string, updateDto: UpdateEventMeetingDto): Promise<EventMeeting> {
    const updated = await this.eventMeetingModel
      .findByIdAndUpdate(meetingId, updateDto, { new: true })
      .populate('attendeeIds')
      .populate('sponsorId')
      .exec();
    if (!updated) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
    }
    return updated;
  }

  async removeMeeting(meetingId: string): Promise<void> {
    const result = await this.eventMeetingModel
      .findByIdAndUpdate(meetingId, { isDeleted: new Date() })
      .exec();
    if (!result) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
    }
  }
}
