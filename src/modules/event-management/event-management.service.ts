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
import {
  CreateEventMeetingDto,
  UpdateEventMeetingDto,
} from './dto/event-meeting.dto';
import { UrlService } from '@core/files/services/url.service';
import { FilesService } from '@core/files/services/files.service';
import { FileModule } from '@core/files/enums/file-module.enum';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AppEvents,
  EventCreatedEvent,
  EventUpdatedEvent,
  EventDeletedEvent,
  EventMeetingCreatedEvent,
} from '@modules/events/event-definitions';

/** Only fetch the fields we need from the File document when populating */
const IMAGE_POPULATE_SELECT = '_id key variants metadata';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<Event>,
    @InjectModel(EventMeeting.name)
    private eventMeetingModel: Model<EventMeeting>,
    private readonly urlService: UrlService,
    private readonly filesService: FilesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Transform populated File references into lean image objects
   * and enrich bannerImage / seo.ogImage with CDN variant URLs.
   */
  private transformImageFields(event: any): any {
    if (!event) return event;

    const obj = event.toJSON ? event.toJSON() : { ...event };

    // Transform bannerImageId — only if it was actually populated (has 'key')
    if (
      obj.bannerImageId &&
      typeof obj.bannerImageId === 'object' &&
      obj.bannerImageId.key
    ) {
      const file = obj.bannerImageId;
      const url = this.urlService.getPublicUrl(file.key);
      const urlVariants = file.variants
        ? this.urlService.getVariantUrls(file.variants)
        : {};

      obj.bannerImageId = {
        id: file.id || file._id,
        metadata: file.metadata || {},
        url,
        urlVariants,
      };

      // Enrich bannerImage with variant URLs
      obj.bannerImage = {
        original: url,
        ...urlVariants,
      };
    }

    // Transform seo.ogImageId — only if it was actually populated (has 'key')
    if (
      obj.seo?.ogImageId &&
      typeof obj.seo.ogImageId === 'object' &&
      obj.seo.ogImageId.key
    ) {
      const file = obj.seo.ogImageId;
      const url = this.urlService.getPublicUrl(file.key);
      const urlVariants = file.variants
        ? this.urlService.getVariantUrls(file.variants)
        : {};

      obj.seo.ogImageId = {
        id: file.id || file._id,
        metadata: file.metadata || {},
        url,
        urlVariants,
      };

      obj.seo.ogImage = {
        original: url,
        ...urlVariants,
      };
    }

    return obj;
  }

  /**
   * Prevents storing full CDN URLs in the database when a File ref is provided.
   */
  private sanitizeImageUrls(dto: any) {
    if (dto.bannerImage) {
      if (dto.bannerImageId) {
        delete dto.bannerImage;
      } else if (typeof dto.bannerImage === 'object') {
        const url = dto.bannerImage.original || dto.bannerImage.url;
        if (url && typeof url === 'string') {
          dto.bannerImage = url;
        } else {
          delete dto.bannerImage;
        }
      }
    }

    if (dto.seo) {
      if (dto.seo.ogImage) {
        if (dto.seo.ogImageId) {
          delete dto.seo.ogImage;
        } else if (typeof dto.seo.ogImage === 'object') {
          const url = dto.seo.ogImage.original || dto.seo.ogImage.url;
          if (url && typeof url === 'string') {
            dto.seo.ogImage = url;
          } else {
            delete dto.seo.ogImage;
          }
        }
      }
    }
  }

  async create(
    createEventDto: CreateEventDto,
    bannerFile?: Express.Multer.File,
    uploadedBy?: string,
  ): Promise<Event> {
    const existing = await this.eventModel
      .findOne({ slug: createEventDto.slug })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Event with slug ${createEventDto.slug} already exists`,
      );
    }

    // Parse JSON string fields from multipart/form-data
    this.parseFormDataFields(createEventDto);
    this.sanitizeImageUrls(createEventDto);

    const createdEvent = new this.eventModel(createEventDto);
    const savedEvent = await createdEvent.save();

    // Upload banner image if file is provided
    if (bannerFile && uploadedBy) {
      await this.uploadAndSetBanner(
        savedEvent._id.toString(),
        bannerFile,
        uploadedBy,
      );
    }

    const saved = await this.findOne(savedEvent._id.toString());

    this.eventEmitter.emit(
      AppEvents.EVENT_CREATED,
      new EventCreatedEvent(
        saved._id.toString(),
        saved.title,
        saved.type,
        uploadedBy || '',
      ),
    );

    return saved;
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
          .populate('bannerImageId', IMAGE_POPULATE_SELECT)
          .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
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

          const eventJson = this.transformImageFields(event);
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
      .populate('bannerImageId', IMAGE_POPULATE_SELECT)
      .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
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

        const eventJson = this.transformImageFields(event);
        eventJson.totalRegistrations = totalRegistrations;
        return eventJson;
      }),
    );

    return eventsWithRegistrations;
  }

  /**
   * Website-facing findAll — returns only summary fields needed for listing.
   * Heavy fields (description, agenda, invitedEmails, seo, sponsors, websites)
   * are excluded and only available via the single event detail endpoint.
   */
  async findAllForWebsite(
    filters: {
      websiteId?: string;
      status?: EventStatus;
      page?: number;
      limit?: number;
      search?: string;
      type?: EventType;
    } = {},
  ): Promise<PaginatedResponseDto<Partial<Event>>> {
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
      query.$or = [{ title: searchRegex }, { slug: searchRegex }];
    }

    // Default to active events
    query.isActive = { $ne: false };

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    // Only select summary fields needed for listing
    const summaryProjection = {
      title: 1,
      slug: 1,
      excerpt: 1,
      type: 1,
      startDate: 1,
      endDate: 1,
      bannerImageId: 1,
    };

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query, summaryProjection)
        .populate('bannerImageId', IMAGE_POPULATE_SELECT)
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.eventModel.countDocuments(query).exec(),
    ]);

    const data = await Promise.all(
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

        const eventJson = this.transformImageFields(event);
        eventJson.totalRegistrations = totalRegistrations;
        return eventJson;
      }),
    );

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

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('websites')
      .populate('sponsors')
      .populate('bannerImageId', IMAGE_POPULATE_SELECT)
      .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
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

    const eventJson = this.transformImageFields(event);
    eventJson.totalRegistrations = totalRegistrations;
    return eventJson;
  }

  async findBySlug(slug: string): Promise<Event> {
    const event = await this.eventModel
      .findOne({ slug })
      .populate('websites')
      .populate('sponsors')
      .populate('bannerImageId', IMAGE_POPULATE_SELECT)
      .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
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

    const eventJson = this.transformImageFields(event);
    eventJson.totalRegistrations = totalRegistrations;
    return eventJson;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    bannerFile?: Express.Multer.File,
    uploadedBy?: string,
  ): Promise<Event> {
    // Parse JSON string fields from multipart/form-data
    this.parseFormDataFields(updateEventDto);
    this.sanitizeImageUrls(updateEventDto);

    // Upload new banner image if file is provided
    if (bannerFile && uploadedBy) {
      await this.uploadAndSetBanner(id, bannerFile, uploadedBy);
    }

    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .populate('websites')
      .populate('sponsors')
      .populate('bannerImageId', IMAGE_POPULATE_SELECT)
      .populate('seo.ogImageId', IMAGE_POPULATE_SELECT)
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

    const eventJson = this.transformImageFields(updatedEvent);
    eventJson.totalRegistrations = totalRegistrations;

    this.eventEmitter.emit(
      AppEvents.EVENT_UPDATED,
      new EventUpdatedEvent(
        updatedEvent._id.toString(),
        updatedEvent.title,
        updateEventDto,
      ),
    );

    return eventJson;
  }

  /**
   * Upload a banner image file via FilesService and set bannerImageId on the event.
   */
  private async uploadAndSetBanner(
    eventId: string,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<void> {
    const uploadedFile = await this.filesService.upload(
      file,
      {
        module: FileModule.EVENTS,
        entityType: 'banner',
        entityId: eventId,
      },
      uploadedBy,
    );

    const fileId = uploadedFile.id || (uploadedFile as any)._id;
    await this.eventModel
      .findByIdAndUpdate(eventId, {
        bannerImageId: fileId,
      })
      .exec();
  }

  /**
   * When using multipart/form-data, nested objects and arrays arrive as JSON strings.
   * This method parses them back into proper objects.
   */
  private parseFormDataFields(dto: any): void {
    const jsonFields = [
      'description',
      'location',
      'agenda',
      'seo',
      'websites',
      'sponsors',
      'invitedEmails',
      'scheduledEmails',
    ];
    for (const field of jsonFields) {
      if (dto[field] && typeof dto[field] === 'string') {
        try {
          dto[field] = JSON.parse(dto[field]);
        } catch {
          // Keep the original value if parsing fails
        }
      }
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();
    if (!result) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    this.eventEmitter.emit(
      AppEvents.EVENT_DELETED,
      new EventDeletedEvent(result._id.toString(), result.title),
    );
  }

  async createMeeting(
    eventId: string,
    createDto: CreateEventMeetingDto,
  ): Promise<EventMeeting> {
    const event = await this.eventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    const createdMeeting = new this.eventMeetingModel({
      ...createDto,
      eventId,
    });
    const savedMeeting = await createdMeeting.save();
    const result = await this.findMeetingById(savedMeeting._id.toString());

    const eventTitle = event.title || '';
    const time = result.agendaTime || '';
    const date = event.startDate
      ? new Date(event.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
    const eventDetails = event.excerpt || '';

    this.eventEmitter.emit(
      AppEvents.EVENT_MEETING_CREATED,
      new EventMeetingCreatedEvent(
        result._id.toString(),
        eventId,
        result.agendaTitle,
        eventTitle,
        time,
        date,
        eventDetails,
      ),
    );

    return result;
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

  async updateMeeting(
    meetingId: string,
    updateDto: UpdateEventMeetingDto,
  ): Promise<EventMeeting> {
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
