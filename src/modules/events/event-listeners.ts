import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  UserCreatedEvent,
  OrderPlacedEvent,
  PaymentCompletedEvent,
  FileUploadedEvent,
  AppEvents,
} from './event-definitions';
import { CommunicationsService } from '../communications/communications.service';
import { SystemUsersService } from '@core/system-users/system-users.service';

@Injectable()
export class EventListeners {
  private readonly logger = new Logger(EventListeners.name);

  constructor(
    private readonly communicationsService: CommunicationsService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  private async triggerMappedEvent(eventName: string, payload: any) {
    try {
      const mapping = await this.communicationsService.findEventMappingByEvent(eventName);
      if (!mapping || !mapping.isActive) {
        this.logger.debug(`No active event mapping found for event: ${eventName}`);
        return;
      }

      const template = mapping.templateId as any;
      if (!template) {
        this.logger.warn(`Template not found for event mapping: ${eventName}`);
        return;
      }

      // Resolve recipient
      let recipient = '';
      if (payload.email) {
        recipient = payload.email;
      } else if (payload.recipient) {
        recipient = payload.recipient;
      } else if (payload.userId) {
        const user = await this.systemUsersService.findOne(payload.userId);
        if (user) {
          recipient = user.email;
        }
      }

      if (!recipient) {
        this.logger.warn(`Could not resolve a recipient email for event ${eventName}. Payload: ${JSON.stringify(payload)}`);
        return;
      }

      this.logger.log(`Dispatching template "${template.slug}" for event: ${eventName} to: ${recipient}`);
      await this.communicationsService.dispatchTemplateMessage({
        slug: template.slug,
        recipient,
        params: payload,
      });
    } catch (err) {
      this.logger.error(`Error processing event-template mapping for event ${eventName}: ${err.message}`);
    }
  }

  // ──────────────────────────────────────────────
  // User Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.USER_CREATED)
  handleUserCreated(event: UserCreatedEvent) {
    this.logger.log(
      `📧 New user created: ${event.email} (ID: ${event.userId})`,
    );
    this.triggerMappedEvent(AppEvents.USER_CREATED, event);
  }

  // ──────────────────────────────────────────────
  // Order Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.ORDER_PLACED)
  handleOrderPlaced(event: OrderPlacedEvent) {
    this.logger.log(
      `🛒 Order placed: ${event.orderId} by user ${event.userId} — $${event.totalAmount}`,
    );
    this.triggerMappedEvent(AppEvents.ORDER_PLACED, event);
  }

  // ──────────────────────────────────────────────
  // Payment Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.PAYMENT_COMPLETED)
  handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(
      `💳 Payment completed: ${event.paymentId} for order ${event.orderId} — $${event.amount} via ${event.method}`,
    );
    this.triggerMappedEvent(AppEvents.PAYMENT_COMPLETED, event);
  }

  // ──────────────────────────────────────────────
  // File Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.FILE_UPLOADED)
  handleFileUploaded(event: FileUploadedEvent) {
    this.logger.log(
      `📁 File uploaded: ${event.filename} (${(event.size / 1024).toFixed(1)} KB) by user ${event.userId}`,
    );
    this.triggerMappedEvent(AppEvents.FILE_UPLOADED, event);
  }
}
