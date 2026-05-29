import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';

@Processor('emails')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-welcome')
  async handleWelcomeEmail(job: Job) {
    this.logger.debug(
      `[Background Job Started] Sending welcome email to ${job.data.email}...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
    this.logger.debug(
      `[Background Job Complete] Welcome email successfully sent to ${job.data.email}!`,
    );
  }

  @Process('send-event-registration')
  async handleEventRegistration(job: Job) {
    const {
      email,
      name,
      organization,
      eventName,
      passCode,
      qrCode,
      startDate,
      endDate,
      location,
      sponsors,
    } = job.data;

    this.logger.debug(
      `[Background Job Started] Sending event registration email to ${email} for ${eventName}...`,
    );

    const calendarUrl = this.generateGoogleCalendarUrl(
      eventName,
      startDate,
      endDate,
      location,
    );

    // Simulate background processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const sponsorsText =
      sponsors && sponsors.length > 0
        ? `\n      Proudly Sponsored by: ${sponsors.join(', ')}`
        : '';

    const orgText = organization ? ` (${organization})` : '';

    this.logger.debug(`
      [Email Sent to ${email}]
      Hi ${name}${orgText},
      You have successfully registered for ${eventName}!
      
      Your Pass Code: ${passCode}
      Date: ${new Date(startDate).toLocaleString()}
      Location: ${location}${sponsorsText}
      Add to Calendar: ${calendarUrl}
      [QR Code Attached: ${qrCode ? qrCode.substring(0, 50) + '...' : 'N/A'}]
    `);

    this.logger.debug(
      `[Background Job Complete] Registration email successfully sent to ${email}!`,
    );
  }

  private generateGoogleCalendarUrl(
    title: string,
    start: string,
    end: string,
    location: string,
  ): string {
    const format = (dateStr: string) =>
      new Date(dateStr).toISOString().replace(/-|:|\.\d+/g, '');
    const dates = `${format(start)}/${format(end)}`;
    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    return `${baseUrl}&text=${encodeURIComponent(title)}&dates=${dates}&location=${encodeURIComponent(location)}`;
  }
}
