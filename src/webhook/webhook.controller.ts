import { Controller, Post, Body, Req, Headers, UnauthorizedException, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';

class RepositoryDto {
  @ApiProperty({
    example: 'Backend-Core-Media',
    description: 'The name of the GitHub repository triggering the webhook.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class GitHubWebhookDto {
  @ApiProperty({
    example: 'refs/heads/main',
    description: 'The git reference (branch or tag) that was pushed.',
  })
  @IsString()
  @IsNotEmpty()
  ref: string;

  @ApiProperty({
    type: RepositoryDto,
    description: 'Information about the repository.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RepositoryDto)
  repository: RepositoryDto;
}

@ApiTags('System')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) { }

  @Post('github')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'GitHub Webhook endpoint for Auto-Deployment',
    description: 'Processes incoming GitHub Webhook events (push/ping), validates the HMAC-SHA256 signature, and runs deployment script.',
  })
  @ApiHeader({
    name: 'x-hub-signature-256',
    description: 'The HMAC-SHA256 signature of the payload (e.g., sha256=xxx) generated using the webhook secret.',
    required: true,
  })
  @ApiHeader({
    name: 'x-github-event',
    description: 'The GitHub event that triggered the webhook (e.g., "push" or "ping").',
    required: true,
  })
  @ApiBody({
    type: GitHubWebhookDto,
    description: 'GitHub Webhook payload containing push details.',
  })
  @ApiResponse({ status: 200, description: 'Webhook event processed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized request - Invalid or missing HMAC signature.' })
  async handleGitHubWebhook(
    @Req() req: any,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Body() payload: GitHubWebhookDto,
  ) {
    this.logger.log(`Received GitHub Webhook event: "${event}"`);

    // 1. Support GitHub's initial ping connection check
    if (event === 'ping') {
      this.logger.log('GitHub Webhook handshake "ping" received. Responding with pong.');
      return { status: 'success', message: 'pong' };
    }

    // 2. Perform HMAC-SHA256 signature verification
    const isSignatureValid = this.webhookService.verifySignature(req.rawBody, signature);
    if (!isSignatureValid) {
      this.logger.error('Webhook signature verification failed. Rejecting request.');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 3. For push events, process branch & repository and trigger deploy
    if (event === 'push') {
      const ref = payload.ref; // e.g. refs/heads/main
      const repoName = payload.repository?.name; // e.g. Backend-Core-Media or Admin-Panel-Frontend

      this.logger.log(`Push event details: Repository = ${repoName}, Branch = ${ref}`);

      const backendBranch = this.configService.get<string>('DEPLOY_BACKEND_BRANCH') || 'refs/heads/main';
      const frontendBranch = this.configService.get<string>('DEPLOY_FRONTEND_BRANCH') || 'refs/heads/main';

      let triggered = false;

      if (repoName === 'Backend-Core-Media') {
        if (ref === backendBranch) {
          triggered = true;
          // Spawn deployment asynchronously (non-blocking)
          this.webhookService.deploy('backend');
        } else {
          this.logger.warn(`Push to branch ${ref} does not match backend target branch ${backendBranch}. Skipping deployment.`);
        }
      } else if (repoName === 'Admin-Panel-Frontend') {
        if (ref === frontendBranch) {
          triggered = true;
          // Spawn deployment asynchronously (non-blocking)
          this.webhookService.deploy('frontend');
        } else {
          this.logger.warn(`Push to branch ${ref} does not match frontend target branch ${frontendBranch}. Skipping deployment.`);
        }
      } else {
        this.logger.warn(`Push event from unknown or unsupported repository: "${repoName}". Skipping.`);
      }

      return {
        status: 'success',
        message: triggered
          ? `Deployment triggered in the background for ${repoName}.`
          : `Criteria not met for ${repoName} (Branch: ${ref}). No deploy triggered.`,
        repository: repoName,
        branch: ref,
        triggered,
      };
    }

    return {
      status: 'success',
      message: `Event "${event}" is ignored.`,
    };
  }
}
