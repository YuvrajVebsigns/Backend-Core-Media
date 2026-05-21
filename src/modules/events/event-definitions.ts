// ──────────────────────────────────────────────
// Domain Event Definitions
// Define all application events here as typed classes
// ──────────────────────────────────────────────

export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: Record<string, any>,
    public readonly updatedAt: Date = new Date(),
  ) {}
}

export class OrderPlacedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: Array<{ productId: string; quantity: number }>,
    public readonly totalAmount: number,
    public readonly placedAt: Date = new Date(),
  ) {}
}

export class PaymentCompletedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly method: string,
    public readonly completedAt: Date = new Date(),
  ) {}
}

export class FileUploadedEvent {
  constructor(
    public readonly fileId: string,
    public readonly userId: string,
    public readonly filename: string,
    public readonly mimetype: string,
    public readonly size: number,
    public readonly uploadedAt: Date = new Date(),
  ) {}
}

// ──────────────────────────────────────────────
// Event Name Constants
// Use these to avoid magic strings across the app
// ──────────────────────────────────────────────

export const AppEvents = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  ORDER_PLACED: 'order.placed',
  PAYMENT_COMPLETED: 'payment.completed',
  FILE_UPLOADED: 'file.uploaded',
} as const;
