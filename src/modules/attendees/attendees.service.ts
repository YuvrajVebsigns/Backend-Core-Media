import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendee, AttendeeStatus } from './schemas/attendee.schema';
import { RegisterAttendeeDto } from './dto/attendee.dto';
import { EventManagementService } from '@modules/event-management/event-management.service';
import { JobsService } from '@core/jobs/jobs.service';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectModel(Attendee.name) private attendeeModel: Model<Attendee>,
    private readonly eventService: EventManagementService,
    private readonly jobsService: JobsService,
  ) {}

  async register(registerDto: RegisterAttendeeDto): Promise<Attendee> {
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

    const attendee = new this.attendeeModel({
      ...registerDto,
      passCode,
      qrCode,
      status: AttendeeStatus.REGISTERED,
    });

    const savedAttendee = await attendee.save();

    // Send registration email via background job
    await this.jobsService.addJob('emails', 'send-event-registration', {
      email: savedAttendee.email,
      name: savedAttendee.name,
      eventName: event.title,
      passCode: savedAttendee.passCode,
      qrCode: savedAttendee.qrCode,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location?.address || 'Online',
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
    return attendee.save();
  }

  async findAllByEvent(eventId: string): Promise<Attendee[]> {
    return this.attendeeModel.find({ eventId: eventId as any }).exec();
  }

  private generatePassCode(): string {
    return randomBytes(4).toString('hex').toUpperCase(); // e.g. "A1B2C3D4"
  }
}
