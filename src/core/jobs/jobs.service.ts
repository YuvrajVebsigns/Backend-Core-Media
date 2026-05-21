import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('emails') private readonly emailsQueue: Queue,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectQueue('image-processing')
    private readonly imageProcessingQueue: Queue,
  ) {}

  async sendWelcomeEmail(email: string, name: string) {
    // Add job to the queue, with auto-retry if it fails
    await this.emailsQueue.add(
      'send-welcome',
      { email, name },
      { attempts: 3, backoff: 5000 },
    );
  }

  async sendPushNotification(userId: string, message: string) {
    await this.notificationsQueue.add('push', { userId, message });
  }

  async processImage(imageId: string) {
    await this.imageProcessingQueue.add('resize', { imageId });
  }

  async addJob(
    queueName: 'emails' | 'notifications' | 'image-processing',
    jobName: string,
    data: any,
  ) {
    const queue = this[`${queueName}Queue`];
    if (queue) {
      await queue.add(jobName, data, { attempts: 3, backoff: 5000 });
    }
  }
}
