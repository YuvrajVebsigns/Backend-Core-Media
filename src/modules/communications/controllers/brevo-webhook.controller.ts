import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { BrevoWebhookEventDto } from '../dto/brevo-webhook.dto';
import { CommunicationsService } from '../communications.service';

/**
 * Public webhook receiver for Brevo transactional email events.
 *
 * This controller is NOT behind any auth guard because Brevo
 * sends raw HTTP POST requests and cannot provide JWT tokens.
 * IP whitelisting at the infrastructure level is recommended
 * for production (see Brevo IP ranges docs).
 *
 * Brevo docs: https://developers.brevo.com/docs/transactional-webhooks
 */
@ApiTags('Webhooks | Brevo')
@SkipThrottle()
@Controller('webhooks/brevo')
export class BrevoWebhookController {
  private readonly logger = new Logger(BrevoWebhookController.name);

  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Receive Brevo transactional email event webhooks (delivered, opened, bounced, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Event acknowledged' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async handleBrevoEvent(@Body() payload: BrevoWebhookEventDto) {
    this.logger.log(
      `Brevo webhook received: event="${payload.event}" email="${payload.email}" messageId="${payload['message-id'] || 'N/A'}"`,
    );

    try {
      await this.communicationsService.handleBrevoWebhook(payload);
    } catch (error) {
      // Log but still return 200 to Brevo to prevent retries for processing errors.
      // Only validation failures (400) should trigger Brevo retries.
      this.logger.error(
        `Failed to process Brevo webhook: ${error.message}`,
        error.stack,
      );
    }

    return { received: true };
  }
}
