import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { WebhookService, DEPLOY_REGISTRY } from './webhook.service';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// GitHub repo name  →  deployment target registry
//
// To add a new GitHub repo / deployment mapping, add ONE entry here.
// No handler logic needs to change.
// ---------------------------------------------------------------------------
const GITHUB_REPO_MAP: Record<string, string> = {
  'Backend-Core-Media': 'backend',
  'Admin-Panel-Frontend': 'frontend',
  'www.core-mediagroup.com': 'website-1',
};

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('System')
@SkipThrottle()
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('github')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'GitHub Webhook endpoint for Auto-Deployment',
    description:
      'Processes incoming GitHub Webhook events (push/ping), validates the HMAC-SHA256 signature, and runs the deployment script.',
  })
  @ApiHeader({
    name: 'x-hub-signature-256',
    description:
      'The HMAC-SHA256 signature of the payload (e.g., sha256=xxx) generated using the webhook secret.',
    required: true,
  })
  @ApiHeader({
    name: 'x-github-event',
    description:
      'The GitHub event that triggered the webhook (e.g., "push" or "ping").',
    required: true,
  })
  @ApiBody({
    type: GitHubWebhookDto,
    description: 'GitHub Webhook payload containing push details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook event processed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized – invalid or missing HMAC signature.',
  })
  async handleGitHubWebhook(
    @Req() req: any,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received GitHub Webhook event: "${event}"`);

    // 1. Respond to GitHub's initial ping handshake
    if (event === 'ping') {
      this.logger.log('GitHub Webhook "ping" received. Responding with pong.');
      return { status: 'success', message: 'pong' };
    }

    // 2. HMAC-SHA256 signature verification
    if (!this.webhookService.verifySignature(req.rawBody, signature)) {
      this.logger.error(
        'Webhook signature verification failed. Rejecting request.',
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 3. Handle push events
    if (event === 'push') {
      return this.handlePush(payload as GitHubWebhookDto);
    }

    return { status: 'success', message: `Event "${event}" is ignored.` };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private handlePush(payload: GitHubWebhookDto) {
    const repoName = payload.repository?.name;
    const ref = payload.ref;

    this.logger.log(`Push event: repo = ${repoName}, ref = ${ref}`);

    // Resolve which deployment target this repo maps to
    const target = GITHUB_REPO_MAP[repoName];
    if (!target) {
      this.logger.warn(
        `Push from unknown/unsupported repository "${repoName}". Skipping.`,
      );
      return {
        status: 'success',
        message: `Repository "${repoName}" is not mapped to any deployment. Skipping.`,
        repository: repoName,
        branch: ref,
        triggered: false,
      };
    }

    // Resolve the expected branch for this target from env
    const registryEntry = DEPLOY_REGISTRY[target];
    const expectedBranch =
      this.configService.get<string>(registryEntry.branchKey) ||
      'refs/heads/main';

    if (ref !== expectedBranch) {
      this.logger.warn(
        `Push to "${ref}" does not match target branch "${expectedBranch}" for "${target}". Skipping.`,
      );
      return {
        status: 'success',
        message: `Branch "${ref}" does not match target branch "${expectedBranch}" for "${target}". No deploy triggered.`,
        repository: repoName,
        branch: ref,
        triggered: false,
      };
    }

    // Fire deployment asynchronously (non-blocking)
    this.webhookService.deploy(target);

    return {
      status: 'success',
      message: `Deployment triggered in the background for "${repoName}" (→ ${target}).`,
      repository: repoName,
      branch: ref,
      triggered: true,
    };
  }
}
