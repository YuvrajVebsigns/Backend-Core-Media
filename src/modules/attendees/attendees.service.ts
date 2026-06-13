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
  ) { }

  async register(
    registerDto: RegisterAttendeeDto,
    websiteId?: string,
  ): Promise<any> {
    const event = await this.eventService.findOne(registerDto.eventId);

    // CRM business logic: Find or create the Registree by email first
    let registree = await this.registreeModel.findOne({ email: registerDto.email }).exec();

    // Check if user is blocked globally or for any registrations
    const blockedAttendee = await this.attendeeModel.findOne({
      email: registerDto.email,
      status: AttendeeStatus.BLOCKED,
    }).exec();

    const hasBlockedRegistration = registree?.registrations?.some(
      (r: any) => r.status === 'BLOCKED',
    );

    if (blockedAttendee || hasBlockedRegistration) {
      throw new BadRequestException('Your registration is blocked');
    }

    // Check if already registered (pending or approved)
    const existingAttendee = await this.attendeeModel.findOne({
      eventId: registerDto.eventId as any,
      email: registerDto.email,
    }).exec();

    if (existingAttendee) {
      throw new ConflictException('You are already registered for this event');
    }

    const existingReg = registree?.registrations?.find(
      (r: any) => r.eventId.toString() === registerDto.eventId && r.status !== 'REJECTED',
    );

    if (existingReg) {
      if (existingReg.status === 'APPROVED') {
        throw new ConflictException('You are already registered for this event');
      } else if (existingReg.status === 'PENDING') {
        throw new ConflictException('Your registration for this event is pending approval');
      } else if (existingReg.status === 'BLOCKED') {
        throw new BadRequestException('Your registration is blocked');
      }
    }

    if (!registree) {
      registree = new this.registreeModel({
        name: registerDto.name,
        email: registerDto.email,
        countryCode: registerDto.countryCode || '',
        phoneNumber: registerDto.phoneNumber || '',
        organization: registerDto.organization || '',
        tags: ['registree'],
        websiteId: websiteId ? new Types.ObjectId(websiteId) as any : undefined,
      });
    } else {
      registree.name = registerDto.name;
      if (registerDto.countryCode) {
        registree.countryCode = registerDto.countryCode;
      }
      if (registerDto.phoneNumber) {
        registree.phoneNumber = registerDto.phoneNumber;
      }
      if (registerDto.organization) {
        registree.organization = registerDto.organization;
      }
      if (websiteId) {
        registree.websiteId = new Types.ObjectId(websiteId) as any;
      }
    }

    if (!registree.registrations) {
      registree.registrations = [];
    }

    registree.registrations.push({
      eventId: new Types.ObjectId(registerDto.eventId) as any,
      name: registerDto.name,
      email: registerDto.email,
      countryCode: registerDto.countryCode || '',
      phoneNumber: registerDto.phoneNumber || '',
      organization: registerDto.organization || '',
      status: 'PENDING',
      registeredAt: new Date(),
    });

    await registree.save();

    return {
      success: true,
      message: 'Event Registration submitted successfully.',
    };
  }

  async checkIn(
    passCode: string,
    checkedInBy?: { userId: string; name: string; email: string },
  ): Promise<Attendee> {
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

    if (checkedInBy) {
      attendee.set('checkedInBy', {
        userId: new Types.ObjectId(checkedInBy.userId),
        name: checkedInBy.name,
        email: checkedInBy.email,
      });
    }

    if (attendee.registrationDetails) {
      attendee.registrationDetails.attended = true;
      attendee.registrationDetails.attendedAt = new Date();
      attendee.markModified('registrationDetails');
    }

    return attendee.save();
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

    if (query.countryCode) {
      matchQuery.countryCode = query.countryCode;
    }

    if (query.phoneNumber) {
      matchQuery.phoneNumber = query.phoneNumber;
    }

    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      matchQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { countryCode: searchRegex },
        { phoneNumber: searchRegex },
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

    // CRM business logic: Find or create the Registree by email first
    let registreeId: any = undefined;
    try {
      let registree = await this.registreeModel.findOne({ email: createDto.email }).exec();

      if (!registree) {
        registree = new this.registreeModel({
          name: createDto.name,
          email: createDto.email,
          countryCode: createDto.countryCode || '',
          phoneNumber: createDto.phoneNumber || '',
          organization: createDto.organization || '',
          tags: ['registree'],
          websiteId: createDto.websiteId ? new Types.ObjectId(createDto.websiteId) as any : undefined,
        });
      } else {
        registree.name = createDto.name;
        if (createDto.countryCode) {
          registree.countryCode = createDto.countryCode;
        }
        if (createDto.phoneNumber) {
          registree.phoneNumber = createDto.phoneNumber;
        }
        if (createDto.organization) {
          registree.organization = createDto.organization;
        }
        if (createDto.websiteId) {
          registree.websiteId = new Types.ObjectId(createDto.websiteId) as any;
        }
      }

      const savedRegistree = await registree.save();
      registreeId = savedRegistree._id;
    } catch (e) {
      console.error('CRM Registree tracking error (Admin):', e);
    }

    const attendee = new this.attendeeModel({
      eventId: event.id as any,
      name: createDto.name,
      email: createDto.email,
      countryCode: createDto.countryCode || '',
      phoneNumber: createDto.phoneNumber || '',
      organization: createDto.organization || '',
      passCode,
      qrCode,
      status: createDto.status || AttendeeStatus.REGISTERED,
      ...(createDto.websiteId ? { websiteId: new Types.ObjectId(createDto.websiteId) } : {}),
      ...(registreeId ? { registreeId: registreeId as any } : {}),
      registrationDetails: {
        name: createDto.name,
        countryCode: createDto.countryCode || '',
        phoneNumber: createDto.phoneNumber || '',
        organization: createDto.organization || '',
        websiteId: createDto.websiteId ? new Types.ObjectId(createDto.websiteId) as any : undefined,
        eventId: new Types.ObjectId(event.id) as any,
        passCode,
        qrCode,
        attended: createDto.status === AttendeeStatus.CHECKED_IN,
        attendedAt: createDto.status === AttendeeStatus.CHECKED_IN ? new Date() : undefined,
        savedAt: new Date(),
      },
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

    if (updateDto.status !== undefined) {
      if (updateDto.status === AttendeeStatus.CHECKED_IN && attendee.status !== AttendeeStatus.CHECKED_IN) {
        attendee.checkedInAt = new Date();
        if (attendee.registrationDetails) {
          attendee.registrationDetails.attended = true;
          attendee.registrationDetails.attendedAt = new Date();
          attendee.markModified('registrationDetails');
        }
      } else if (updateDto.status !== AttendeeStatus.CHECKED_IN) {
        attendee.checkedInAt = null as any;
        if (attendee.registrationDetails) {
          attendee.registrationDetails.attended = false;
          attendee.registrationDetails.attendedAt = null as any;
          attendee.markModified('registrationDetails');
        }
      }
      attendee.status = updateDto.status;
    }

    if (updateDto.organization !== undefined) {
      attendee.organization = updateDto.organization;
      if (attendee.registrationDetails) {
        attendee.registrationDetails.organization = updateDto.organization;
        attendee.markModified('registrationDetails');
      }
    }

    if (updateDto.countryCode !== undefined) {
      attendee.countryCode = updateDto.countryCode;
      if (attendee.registrationDetails) {
        attendee.registrationDetails.countryCode = updateDto.countryCode;
        attendee.markModified('registrationDetails');
      }
    }

    if (updateDto.phoneNumber !== undefined) {
      attendee.phoneNumber = updateDto.phoneNumber;
      if (attendee.registrationDetails) {
        attendee.registrationDetails.phoneNumber = updateDto.phoneNumber;
        attendee.markModified('registrationDetails');
      }
    }

    if (updateDto.eventId !== undefined) {
      await this.eventService.findOne(updateDto.eventId);
      attendee.eventId = new Types.ObjectId(updateDto.eventId) as any;
      if (attendee.registrationDetails) {
        attendee.registrationDetails.eventId = new Types.ObjectId(updateDto.eventId) as any;
        attendee.markModified('registrationDetails');
      }
    }

    if (updateDto.websiteId !== undefined) {
      attendee.websiteId = updateDto.websiteId ? new Types.ObjectId(updateDto.websiteId) as any : undefined;
      if (attendee.registrationDetails) {
        attendee.registrationDetails.websiteId = updateDto.websiteId ? new Types.ObjectId(updateDto.websiteId) as any : undefined;
        attendee.markModified('registrationDetails');
      }
    }

    await attendee.save();
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
      const attendees = await this.attendeeModel
        .find({ 
          eventId: new Types.ObjectId(query.eventId) as any, 
          isDeleted: null 
        })
        .select('registreeId')
        .exec();
      const approvedRegistreeIds = attendees.map((a) => a.registreeId).filter(Boolean);
      matchQuery.$or = [
        { _id: { $in: approvedRegistreeIds } },
        { 'registrations.eventId': new Types.ObjectId(query.eventId) }
      ];
    } else {
      const attendees = await this.attendeeModel
        .find({ isDeleted: null })
        .select('registreeId')
        .exec();
      const approvedRegistreeIds = attendees.map((a) => a.registreeId).filter(Boolean);
      matchQuery.$or = [
        { _id: { $in: approvedRegistreeIds } },
        { 'registrations.0': { $exists: true } },
        { 'downloadedReports.0': { $exists: true } }
      ];
    }

    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }

    if (query.tag) {
      matchQuery.tags = query.tag;
    }

    if (query.search) {
      const searchRegex = { $regex: query.search, $options: 'i' };
      matchQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { countryCode: searchRegex },
        { phoneNumber: searchRegex },
        { organization: searchRegex },
        { city: searchRegex },
      ];
    }

    const [data, total] = await Promise.all([
      this.registreeModel
        .find(matchQuery)
        .populate('websiteId', 'name domain logo')
        .populate('registrations.eventId', 'title type status startDate endDate bannerImage location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.registreeModel.countDocuments(matchQuery).exec(),
    ]);

    // Populate registration history and events lists dynamically from Attendee collection
    const registreeIds = data.map((r) => r._id);
    const allAttendees = await this.attendeeModel
      .find({ registreeId: { $in: registreeIds as any[] } })
      .populate('eventId', 'title type status startDate endDate bannerImage location')
      .populate('websiteId', 'name')
      .exec();

    const attendeesMap = new Map<string, any[]>();
    for (const attendee of allAttendees) {
      const rId = attendee.registreeId?.toString();
      if (rId) {
        if (!attendeesMap.has(rId)) {
          attendeesMap.set(rId, []);
        }
        attendeesMap.get(rId)!.push(attendee);
      }
    }

    const populatedData = data.map((registree) => {
      const regObj: any = registree.toObject();
      regObj.joinedAt = regObj.createdAt;
      const regAttendees = attendeesMap.get(registree._id.toString()) || [];
      const registrationsList = regObj.registrations || [];

      // Combine eventIds
      const attendeeEventIds = regAttendees.map((a) => a.eventId);
      const pendingOrRejectedEventIds = registrationsList
        .filter((r: any) => r.status !== 'APPROVED')
        .map((r: any) => r.eventId);
      regObj.eventIds = [...attendeeEventIds, ...pendingOrRejectedEventIds];

      const historyFromAttendees = regAttendees.map((a) => {
        const plainAttendee = a.toObject();
        const eventObj = plainAttendee.eventId;
        return {
          ...plainAttendee.registrationDetails,
          id: plainAttendee.id || plainAttendee._id?.toString(),
          eventId: (eventObj as any)?._id?.toString() || (eventObj as any)?.id || plainAttendee.registrationDetails?.eventId?.toString(),
          event: eventObj,
          status: 'APPROVED',
          attended: a.status === AttendeeStatus.CHECKED_IN,
          attendedAt: a.checkedInAt,
          savedAt: a.registeredAt || a.createdAt,
        };
      });

      const historyFromRegistrations = registrationsList
        .filter((r: any) => r.status !== 'APPROVED')
        .map((r: any) => {
          const eventObj = r.eventId;
          return {
            id: r._id?.toString(),
            eventId: (eventObj as any)?._id?.toString() || (eventObj as any)?.id || r.eventId?.toString(),
            event: eventObj,
            name: r.name,
            email: r.email,
            countryCode: r.countryCode,
            phoneNumber: r.phoneNumber,
            organization: r.organization,
            status: r.status,
            attended: false,
            savedAt: r.registeredAt,
          };
        });

      regObj.history = [...historyFromAttendees, ...historyFromRegistrations];
      return regObj;
    });

    return {
      data: populatedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneRegistree(id: string): Promise<any> {
    const registree = await this.registreeModel
      .findById(id)
      .populate('websiteId')
      .populate('registrations.eventId', 'title type status startDate endDate bannerImage location')
      .exec();

    if (!registree) {
      throw new NotFoundException(`Registree with ID ${id} not found`);
    }

    const regAttendees = await this.attendeeModel
      .find({ registreeId: new Types.ObjectId(id) as any })
      .populate('eventId', 'title type status startDate endDate bannerImage location')
      .populate('websiteId', 'name')
      .exec();

    const regObj: any = registree.toObject();
    regObj.joinedAt = regObj.createdAt;
    const registrationsList = regObj.registrations || [];

    // Combine eventIds
    const attendeeEventIds = regAttendees.map((a) => a.eventId);
    const pendingOrRejectedEventIds = registrationsList
      .filter((r: any) => r.status !== 'APPROVED')
      .map((r: any) => r.eventId);
    regObj.eventIds = [...attendeeEventIds, ...pendingOrRejectedEventIds];

    const historyFromAttendees = regAttendees.map((a) => {
      const plainAttendee = a.toObject();
      const eventObj = plainAttendee.eventId;
      return {
        ...plainAttendee.registrationDetails,
        id: plainAttendee.id || plainAttendee._id?.toString(),
        eventId: (eventObj as any)?._id?.toString() || (eventObj as any)?.id || plainAttendee.registrationDetails?.eventId?.toString(),
        event: eventObj,
        status: 'APPROVED',
        attended: a.status === AttendeeStatus.CHECKED_IN,
        attendedAt: a.checkedInAt,
        savedAt: a.registeredAt || a.createdAt,
      };
    });

    const historyFromRegistrations = registrationsList
      .filter((r: any) => r.status !== 'APPROVED')
      .map((r: any) => {
        const eventObj = r.eventId;
        return {
          id: r._id?.toString(),
          eventId: (eventObj as any)?._id?.toString() || (eventObj as any)?.id || r.eventId?.toString(),
          event: eventObj,
          name: r.name,
          email: r.email,
          countryCode: r.countryCode,
          phoneNumber: r.phoneNumber,
          organization: r.organization,
          status: r.status,
          attended: false,
          savedAt: r.registeredAt,
        };
      });

    regObj.history = [...historyFromAttendees, ...historyFromRegistrations];

    return regObj;
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

    if (updateDto.countryCode !== undefined) {
      registree.countryCode = updateDto.countryCode;
    }
    if (updateDto.phoneNumber !== undefined) {
      registree.phoneNumber = updateDto.phoneNumber;
    }
    if (updateDto.organization !== undefined) {
      registree.organization = updateDto.organization;
    }
    if (updateDto.city !== undefined) {
      registree.city = updateDto.city;
    }
    if (updateDto.tags !== undefined) {
      registree.tags = updateDto.tags;
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

  async approveRegistration(registreeId: string, eventId: string): Promise<any> {
    const registree = await this.registreeModel.findById(registreeId).exec();
    if (!registree) {
      throw new NotFoundException(`Registree with ID ${registreeId} not found`);
    }

    const registration = registree.registrations?.find(
      (r: any) => r.eventId.toString() === eventId,
    );
    if (!registration) {
      throw new NotFoundException(`Registration for event ${eventId} not found`);
    }

    if (registration.status === 'APPROVED') {
      throw new BadRequestException('Registration is already approved');
    }

    if (registration.status === 'BLOCKED') {
      throw new BadRequestException('This registration is blocked');
    }

    const existingAttendee = await this.attendeeModel.findOne({
      eventId: eventId as any,
      email: registree.email,
    }).exec();

    if (existingAttendee) {
      throw new ConflictException('Attendee already exists for this event');
    }

    registration.status = 'APPROVED';
    registree.markModified('registrations');
    await registree.save();

    const event = await this.eventService.findOne(eventId);
    const passCode = this.generatePassCode();
    const qrCode = await QRCode.toDataURL(passCode);

    const attendee = new this.attendeeModel({
      eventId: event.id as any,
      name: registration.name || registree.name,
      email: registree.email,
      countryCode: registration.countryCode || registree.countryCode || '',
      phoneNumber: registration.phoneNumber || registree.phoneNumber || '',
      organization: registration.organization || registree.organization || '',
      passCode,
      qrCode,
      status: AttendeeStatus.REGISTERED,
      websiteId: registree.websiteId,
      registreeId: registree._id,
      registrationDetails: {
        name: registration.name || registree.name,
        countryCode: registration.countryCode || registree.countryCode || '',
        phoneNumber: registration.phoneNumber || registree.phoneNumber || '',
        organization: registration.organization || registree.organization || '',
        websiteId: registree.websiteId,
        eventId: new Types.ObjectId(event.id) as any,
        passCode,
        qrCode,
        attended: false,
        savedAt: new Date(),
      },
    });

    const savedAttendee = await attendee.save();

    try {
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
    } catch (err) {
      console.error('Failed to queue registration email:', err);
    }

    return { message: 'Registration approved successfully', attendee: savedAttendee };
  }

  async rejectRegistration(registreeId: string, eventId: string): Promise<any> {
    const registree = await this.registreeModel.findById(registreeId).exec();
    if (!registree) {
      throw new NotFoundException(`Registree with ID ${registreeId} not found`);
    }

    const registration = registree.registrations?.find(
      (r: any) => r.eventId.toString() === eventId,
    );
    if (!registration) {
      throw new NotFoundException(`Registration for event ${eventId} not found`);
    }

    registration.status = 'REJECTED';
    registree.markModified('registrations');
    await registree.save();

    return { message: 'Registration rejected successfully' };
  }

  async blockRegistration(registreeId: string, eventId: string): Promise<any> {
    const registree = await this.registreeModel.findById(registreeId).exec();
    if (!registree) {
      throw new NotFoundException(`Registree with ID ${registreeId} not found`);
    }

    const registration = registree.registrations?.find(
      (r: any) => r.eventId.toString() === eventId,
    );
    if (!registration) {
      throw new NotFoundException(`Registration for event ${eventId} not found`);
    }

    registration.status = 'BLOCKED';
    registree.markModified('registrations');
    await registree.save();

    const attendee = await this.attendeeModel.findOne({
      eventId: eventId as any,
      email: registree.email,
    }).exec();

    if (attendee) {
      attendee.status = AttendeeStatus.BLOCKED;
      await attendee.save();
    }

    return { message: 'Registration blocked successfully' };
  }

  private generatePassCode(): string {
    return randomBytes(4).toString('hex').toUpperCase(); // e.g. "A1B2C3D4"
  }
}
