import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';

@Processor('emails')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-welcome')
  async handleWelcomeEmail(job: Job) {
    this.logger.debug(`[Background Job Started] Sending welcome email to ${job.data.email}...`);

    // Simulate background processing delay (e.g. SMTP server)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    this.logger.debug(`[Background Job Complete] Welcome email successfully sent to ${job.data.email}!`);
  }
}
