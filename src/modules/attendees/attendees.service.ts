import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendee, AttendeeStatus } from './schemas/attendee.schema';
import { Registree } from './schemas/registree.schema';
import {
  RegisterAttendeeDto,
  CreateAttendeeDto,
  UpdateAttendeeDto,
  QueryAttendeeDto,
} from './dto/attendee.dto';
import { UpdateRegistreeDto, QueryRegistreeDto } from './dto/registree.dto';
import { EventsService } from '@modules/event-management/event-management.service';
import { JobsService } from '@core/jobs/jobs.service';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    @InjectModel(Registree.name) private registreeModel: Model<Registree>,
    private readonly eventService: EventsService,
    private readonly jobsService: JobsService,
  ) {}

  async register(
    registerDto: RegisterAttendeeDto,
    websiteId?: string,
  ): Promise<Attendee> {
    const event = await this.eventService.findOne(registerDto.eventId);

    const existing = await this.attendeeModel
      .findOne({
        eventId: registerDto.eventId as any,
        email: registerDto.email,
      })
      .exec();

    if (existing) {
      throw new ConflictException('You are already registered for this event');
    }

    const passCode = this.generatePassCode();
    const qrCode = await QRCode.toDataURL(passCode);

    // CRM business logic: Find or create the Registree by email/phone first
    let registreeId: any = undefined;
    try {
      let registree = await this.registreeModel.findOne({ email: registerDto.email }).exec();

      const historyEntry = {
        name: registerDto.name,
        phone: registerDto.phone || '',
        organization: registerDto.organization || '',
        websiteId: websiteId ? new Types.ObjectId(websiteId) as any : undefined,
        eventId: new Types.ObjectId(event.id) as any,
        passCode,
        qrCode,
        attended: false,
        savedAt: new Date(),
      };

      if (!registree) {
        registree = new this.registreeModel({
          name: registerDto.name,
          email: registerDto.email,
          phone: registerDto.phone || '',
          organization: registerDto.organization || '',
          eventIds: [new Types.ObjectId(event.id) as any],
          websiteId: websiteId ? new Types.ObjectId(websiteId) as any : undefined,
          history: [historyEntry],
        });
      } else {
        registree.name = registerDto.name;
        if (registerDto.phone) {
          registree.phone = registerDto.phone;
        }
        if (registerDto.organization) {
          registree.organization = registerDto.organization;
        }
        if (websiteId) {
          registree.websiteId = new Types.ObjectId(websiteId) as any;
        }

        const eventObjId = new Types.ObjectId(event.id);
        const hasEvent = registree.eventIds.some(
          (id) => id.toString() === eventObjId.toString()
        );
        if (!hasEvent) {
          registree.eventIds.push(eventObjId as any);
        }

        registree.history.push(historyEntry);
      }

      const savedRegistree = await registree.save();
      registreeId = savedRegistree._id;
    } catch (e) {
      // Gracefully log/ignore database write errors for CRM to prevent registration block
      console.error('CRM Registree tracking error:', e);
    }

    const attendee = new this.attendeeModel({
      ...registerDto,
      passCode,
      qrCode,
      status: AttendeeStatus.REGISTERED,
      ...(websiteId ? { websiteId: websiteId as any } : {}),
      ...(registreeId ? { registreeId: registreeId as any } : {}),
    });

    const savedAttendee = await attendee.save();

    // Send registration email via background job
    await this.jobsService.addJob('emails', 'send-event-registration', {
      email: savedAttendee.email,
      name: savedAttendee.name,
      organization: savedAttendee.organization || '',
      eventName: event.title,
      passCode: savedAttendee.passCode,
      qrCode: savedAttendee.qrCode,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location?.address || 'Online',
      sponsors: event.sponsors
        ? event.sponsors.map((s: any) => s.name || s.companyName || s)
        : [],
    });

    return savedAttendee;
  }

  async checkIn(passCode: string): Promise<Attendee> {
    const attendee = await this.attendeeModel.findOne({ passCode }).exec();
    if (!attendee) {
      throw new NotFoundException(`Invalid pass code: ${passCode}`);
    }

    if (attendee.status === AttendeeStatus.CHECKED_IN) {
      throw new BadRequestException('Attendee already checked in');
    }

    if (attendee.status === AttendeeStatus.BLOCKED) {
      throw new BadRequestException('This attendee is blocked');
    }

    attendee.status = AttendeeStatus.CHECKED_IN;
    attendee.checkedInAt = new Date();
    const savedAttendee = await attendee.save();

    // Sync status to global Registree history timeline
    await this.syncRegistreeCheckIn(savedAttendee.email, savedAttendee.eventId.toString());

    return savedAttendee;
  }

  async findByPassCode(passCode: string): Promise<Attendee> {
    const attendee = await this.attendeeModel
      .findOne({ passCode })
      .populate({
        path: 'eventId',
        populate: {
          path: 'sponsors',
        },
      })
      .exec();

    if (!attendee) {
      throw new NotFoundException(`Invalid pass code: ${passCode}`);
    }

    return attendee;
  }

  async findAllByEvent(eventId: string): Promise<Attendee[]> {
    return this.attendeeModel
      .find({ eventId: eventId as any })
      .populate({
        path: 'eventId',
        populate: {
          path: 'sponsors',
        },
      })
      .exec();
  }

  async getCountByEvent(eventId: string): Promise<number> {
    return this.attendeeModel.countDocuments({ eventId: eventId as any }).exec();
  }

  async findAll(query: QueryAttendeeDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const matchQuery: any = {};

    if (query.status) {
      matchQuery.status = query.status;
    }

    if (query.eventId) {
      matchQuery.eventId = new Types.ObjectId(query.eventId);
    }

    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }

    if (query.email) {
      matchQuery.email = query.email;
    }

    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      matchQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { organization: searchRegex },
        { passCode: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.attendeeModel
        .find(matchQuery)
        .populate('eventId', 'title type status startDate endDate bannerImage location')
        .populate('websiteId', 'name domain logo')
        .populate('registreeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.attendeeModel.countDocuments(matchQuery).exec(),
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

  async findOne(id: string): Promise<Attendee> {
    const attendee = await this.attendeeModel
      .findById(id)
      .populate('eventId')
      .populate('websiteId')
      .populate('registreeId')
      .exec();

    if (!attendee) {
      throw new NotFoundException(`Attendee with ID ${id} not found`);
    }

    return attendee;
  }

  async create(createDto: CreateAttendeeDto): Promise<Attendee> {
    const event = await this.eventService.findOne(createDto.eventId);

    const existing = await this.attendeeModel
      .findOne({
        eventId: createDto.eventId as any,
        email: createDto.email,
      })
      .exec();

    if (existing) {
      throw new ConflictException('Attendee already registered for this event');
    }

    const passCode = this.generatePassCode();
    const qrCode = await QRCode.toDataURL(passCode);

    // CRM business logic: Find or create the Registree by email/phone first
    let registreeId: any = undefined;
    try {
      let registree = await this.registreeModel.findOne({ email: createDto.email }).exec();

      const isAttended = createDto.status === AttendeeStatus.CHECKED_IN;
      const historyEntry = {
        name: createDto.name,
        phone: createDto.phone || '',
        organization: createDto.organization || '',
        websiteId: createDto.websiteId ? new Types.ObjectId(createDto.websiteId) as any : undefined,
        eventId: new Types.ObjectId(event.id) as any,
        passCode,
        qrCode,
        attended: isAttended,
        attendedAt: isAttended ? new Date() : undefined,
        savedAt: new Date(),
      };

      if (!registree) {
        registree = new this.registreeModel({
          name: createDto.name,
          email: createDto.email,
          phone: createDto.phone || '',
          organization: createDto.organization || '',
          eventIds: [new Types.ObjectId(event.id) as any],
          websiteId: createDto.websiteId ? new Types.ObjectId(createDto.websiteId) as any : undefined,
          history: [historyEntry],
        });
      } else {
        registree.name = createDto.name;
        if (createDto.phone) {
          registree.phone = createDto.phone;
        }
        if (createDto.organization) {
          registree.organization = createDto.organization;
        }
        if (createDto.websiteId) {
          registree.websiteId = new Types.ObjectId(createDto.websiteId) as any;
        }

        const eventObjId = new Types.ObjectId(event.id);
        const hasEvent = registree.eventIds.some(
          (id) => id.toString() === eventObjId.toString()
        );
        if (!hasEvent) {
          registree.eventIds.push(eventObjId as any);
        }

        registree.history.push(historyEntry);
      }

      const savedRegistree = await registree.save();
      registreeId = savedRegistree._id;
    } catch (e) {
      console.error('CRM Registree tracking error (Admin):', e);
    }

    const attendee = new this.attendeeModel({
      ...createDto,
      passCode,
      qrCode,
      status: createDto.status || AttendeeStatus.REGISTERED,
      ...(createDto.websiteId ? { websiteId: new Types.ObjectId(createDto.websiteId) } : {}),
      ...(registreeId ? { registreeId: registreeId as any } : {}),
      registeredAt: new Date(),
    });

    const saved = await attendee.save();

    // Send registration email via background job
    try {
      await this.jobsService.addJob('emails', 'send-event-registration', {
        email: saved.email,
        name: saved.name,
        organization: saved.organization || '',
        eventName: event.title,
        passCode: saved.passCode,
        qrCode: saved.qrCode,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location?.address || 'Online',
        sponsors: event.sponsors
          ? event.sponsors.map((s: any) => s.name || s.companyName || s)
          : [],
      });
    } catch (e) {
      // Background email fallback
    }

    return this.findOne(saved.id);
  }

  async update(id: string, updateDto: UpdateAttendeeDto): Promise<Attendee> {
    const attendee = await this.attendeeModel.findById(id).exec();
    if (!attendee) {
      throw new NotFoundException(`Attendee with ID ${id} not found`);
    }

    let shouldSyncCheckIn = false;
    if (updateDto.status !== undefined) {
      if (updateDto.status === AttendeeStatus.CHECKED_IN && attendee.status !== AttendeeStatus.CHECKED_IN) {
        attendee.checkedInAt = new Date();
        shouldSyncCheckIn = true;
      }
      attendee.status = updateDto.status;
    }

    if (updateDto.organization !== undefined) {
      attendee.organization = updateDto.organization;
    }

    if (updateDto.eventId !== undefined) {
      await this.eventService.findOne(updateDto.eventId);
      attendee.eventId = new Types.ObjectId(updateDto.eventId) as any;
    }

    if (updateDto.websiteId !== undefined) {
      attendee.websiteId = updateDto.websiteId ? new Types.ObjectId(updateDto.websiteId) as any : undefined;
    }

    const saved = await attendee.save();

    if (shouldSyncCheckIn) {
      await this.syncRegistreeCheckIn(saved.email, saved.eventId.toString());
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.attendeeModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();

    if (!result) {
      throw new NotFoundException(`Attendee with ID ${id} not found`);
    }
  }

  async findAllRegistrees(query: QueryRegistreeDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const matchQuery: any = {};

    if (query.email) {
      matchQuery.email = query.email;
    }

    if (query.eventId) {
      matchQuery.eventIds = new Types.ObjectId(query.eventId);
    }

    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }

    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      matchQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { organization: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.registreeModel
        .find(matchQuery)
        .populate('eventIds', 'title type status startDate endDate bannerImage location')
        .populate('websiteId', 'name domain logo')
        .populate('history.eventId', 'title')
        .populate('history.websiteId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.registreeModel.countDocuments(matchQuery).exec(),
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

  async findOneRegistree(id: string): Promise<Registree> {
    const registree = await this.registreeModel
      .findById(id)
      .populate('eventIds')
      .populate('websiteId')
      .populate('history.eventId', 'title')
      .populate('history.websiteId', 'name')
      .exec();

    if (!registree) {
      throw new NotFoundException(`Registree with ID ${id} not found`);
    }

    return registree;
  }

  async updateRegistree(id: string, updateDto: UpdateRegistreeDto): Promise<Registree> {
    const registree = await this.registreeModel.findById(id).exec();
    if (!registree) {
      throw new NotFoundException(`Registree with ID ${id} not found`);
    }

    if (updateDto.name !== undefined) {
      registree.name = updateDto.name;
    }
    if (updateDto.email !== undefined) {
      const existing = await this.registreeModel.findOne({ email: updateDto.email, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException('Email already registered by another contact');
      }
      registree.email = updateDto.email;
    }
    if (updateDto.phone !== undefined) {
      registree.phone = updateDto.phone;
    }
    if (updateDto.organization !== undefined) {
      registree.organization = updateDto.organization;
    }
    if (updateDto.websiteId !== undefined) {
      registree.websiteId = updateDto.websiteId ? new Types.ObjectId(updateDto.websiteId) as any : undefined;
    }

    await registree.save();
    return this.findOneRegistree(id);
  }

  async removeRegistree(id: string): Promise<void> {
    const result = await this.registreeModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();

    if (!result) {
      throw new NotFoundException(`Registree with ID ${id} not found`);
    }
  }

  async syncRegistreeCheckIn(email: string, eventId: string): Promise<void> {
    try {
      const registree = await this.registreeModel.findOne({ email }).exec();
      if (registree) {
        let updated = false;
        registree.history = registree.history.map((entry) => {
          if (entry.eventId && entry.eventId.toString() === eventId.toString()) {
            entry.attended = true;
            entry.attendedAt = new Date();
            updated = true;
          }
          return entry;
        });
        if (updated) {
          await registree.save();
        }
      }
    } catch (e) {
      console.error('Failed to sync Registree check-in status:', e);
    }
  }

  private generatePassCode(): string {
    return randomBytes(4).toString('hex').toUpperCase(); // e.g. "A1B2C3D4"
  }
}
