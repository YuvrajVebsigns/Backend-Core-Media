import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  UserCreatedEvent,
  OrderPlacedEvent,
  PaymentCompletedEvent,
  FileUploadedEvent,
  AppEvents,
} from './event-definitions';

@Injectable()
export class EventListeners {
  private readonly logger = new Logger(EventListeners.name);

  // ──────────────────────────────────────────────
  // User Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.USER_CREATED)
  handleUserCreated(event: UserCreatedEvent) {
    this.logger.log(
      `📧 New user created: ${event.email} (ID: ${event.userId})`,
    );
    // Example side effects:
    // - Send welcome email via queue
    // - Create default user preferences
    // - Notify analytics service
  }

  // ──────────────────────────────────────────────
  // Order Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.ORDER_PLACED)
  handleOrderPlaced(event: OrderPlacedEvent) {
    this.logger.log(
      `🛒 Order placed: ${event.orderId} by user ${event.userId} — $${event.totalAmount}`,
    );
    // Example side effects:
    // - Reserve inventory
    // - Send order confirmation email
    // - Notify warehouse
  }

  // ──────────────────────────────────────────────
  // Payment Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.PAYMENT_COMPLETED)
  handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(
      `💳 Payment completed: ${event.paymentId} for order ${event.orderId} — $${event.amount} via ${event.method}`,
    );
    // Example side effects:
    // - Update order status to "paid"
    // - Generate invoice
    // - Send payment receipt email
  }

  // ──────────────────────────────────────────────
  // File Events
  // ──────────────────────────────────────────────

  @OnEvent(AppEvents.FILE_UPLOADED)
  handleFileUploaded(event: FileUploadedEvent) {
    this.logger.log(
      `📁 File uploaded: ${event.filename} (${(event.size / 1024).toFixed(1)} KB) by user ${event.userId}`,
    );
    // Example side effects:
    // - Generate thumbnails via image-processing queue
    // - Scan for malware
    // - Update user storage quota
  }
}
