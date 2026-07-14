import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, ScheduleType } from './schemas/event.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvents, EventReminderEvent } from '@modules/events/event-definitions';
import dayjs from 'dayjs';

@Injectable()
export class EventReminderSchedulerService {
  private readonly logger = new Logger(EventReminderSchedulerService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('*/5 * * * *')
  async handleScheduledReminders() {
    this.logger.log('Starting scheduled event reminder job check...');

    const now = dayjs();

    // Find active events with scheduled emails
    const events = await this.eventModel.find({
      isActive: true,
      'scheduledEmails.isActive': true,
      'scheduledEmails.isProcessed': false,
    }).select('startDate scheduledEmails title').exec();

    let processedCount = 0;

    for (const event of events) {
      if (!event.scheduledEmails) continue;

      const eventStart = dayjs(event.startDate);
      let eventUpdated = false;

      for (const schedule of event.scheduledEmails) {
        if (!schedule.isActive || schedule.isProcessed) continue;

        let shouldTrigger = false;
        const days = schedule.daysOffset || 0;
        const hours = schedule.hoursOffset || 0;
        const minutes = schedule.minutesOffset || 0;

        switch (schedule.scheduleType) {
          case ScheduleType.BEFORE_EVENT: {
            const targetDate = eventStart
              .subtract(days, 'day')
              .subtract(hours, 'hour')
              .subtract(minutes, 'minute');
            if (now.isSame(targetDate) || now.isAfter(targetDate)) {
              shouldTrigger = true;
            }
            break;
          }
          case ScheduleType.AFTER_EVENT: {
            const targetDate = eventStart
              .add(days, 'day')
              .add(hours, 'hour')
              .add(minutes, 'minute');
            if (now.isSame(targetDate) || now.isAfter(targetDate)) {
              shouldTrigger = true;
            }
            break;
          }
          case ScheduleType.EXACT_DATE: {
            if (schedule.exactDate) {
              const targetDate = dayjs(schedule.exactDate);
              if (now.isSame(targetDate) || now.isAfter(targetDate)) {
                shouldTrigger = true;
              }
            }
            break;
          }
        }

        if (shouldTrigger) {
          this.logger.log(`Triggering scheduled email (Template: ${schedule.templateId}) for Event: ${event.title}`);
          
          try {
            // Find all approved registrees for this event
            const registreeModel = this.eventModel.db.model('Registree');
            const attendees = await registreeModel.find({
              'registrations.eventId': event._id,
              'registrations.status': 'APPROVED',
            }).select('_id').exec();

            this.logger.log(`Found ${attendees.length} approved attendees for event ${event._id}`);

            for (const attendee of attendees) {
              // Dispatch event reminder
              this.eventEmitter.emit(
                AppEvents.EVENT_REMINDER,
                new EventReminderEvent(
                  attendee._id.toString(),
                  event._id.toString(),
                  schedule.templateId.toString()
                )
              );
            }

            // Mark schedule as processed
            schedule.isProcessed = true;
            eventUpdated = true;
            processedCount++;
          } catch (error) {
            this.logger.error(`Error processing scheduled email for event ${event._id}`, error);
          }
        }
      }

      if (eventUpdated) {
        await event.save();
      }
    }

    this.logger.log(`Finished daily event reminder job. Processed ${processedCount} schedules.`);
  }
}
