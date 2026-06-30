import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Deployment target registry.
 *
 * To add a new deployment target, add a single entry here.
 * No other code in this file (or the controller) needs to change.
 *
 * Keys:
 *   dirKey  — env var that holds the directory path
 *   cmdKey  — env var that holds the shell command
 *   branchKey — env var that holds the target branch (e.g. refs/heads/main)
 */
export const DEPLOY_REGISTRY: Record<
  string,
  { dirKey: string; cmdKey: string; branchKey: string }
> = {
  backend: {
    dirKey: 'DEPLOY_BACKEND_DIR',
    cmdKey: 'DEPLOY_BACKEND_CMD',
    branchKey: 'DEPLOY_BACKEND_BRANCH',
  },
  frontend: {
    dirKey: 'DEPLOY_FRONTEND_DIR',
    cmdKey: 'DEPLOY_FRONTEND_CMD',
    branchKey: 'DEPLOY_FRONTEND_BRANCH',
  },
  'website-1': {
    dirKey: 'DEPLOY_WEBSITE_1_DIR',
    cmdKey: 'DEPLOY_WEBSITE-1_CMD',
    branchKey: 'DEPLOY_WEBSITE_1_BRANCH',
  },
  'website-2': {
    dirKey: 'DEPLOY_WEBSITE_2_DIR',
    cmdKey: 'DEPLOY_WEBSITE_2_CMD',
    branchKey: 'DEPLOY_WEBSITE_2_BRANCH',
  },
  'website-3': {
    dirKey: 'DEPLOY_WEBSITE_3_DIR',
    cmdKey: 'DEPLOY_WEBSITE_3_CMD',
    branchKey: 'DEPLOY_WEBSITE_3_BRANCH',
  },
  'website-4': {
    dirKey: 'DEPLOY_WEBSITE_4_DIR',
    cmdKey: 'DEPLOY_WEBSITE_4_CMD',
    branchKey: 'DEPLOY_WEBSITE_4_BRANCH',
  },
  'website-5': {
    dirKey: 'DEPLOY_WEBSITE_5_DIR',
    cmdKey: 'DEPLOY_WEBSITE_5_CMD',
    branchKey: 'DEPLOY_WEBSITE_5_BRANCH',
  },
  'website-6': {
    dirKey: 'DEPLOY_WEBSITE_6_DIR',
    cmdKey: 'DEPLOY_WEBSITE_6_CMD',
    branchKey: 'DEPLOY_WEBSITE_6_BRANCH',
  },
  'website-7': {
    dirKey: 'DEPLOY_WEBSITE_7_DIR',
    cmdKey: 'DEPLOY_WEBSITE_7_CMD',
    branchKey: 'DEPLOY_WEBSITE_7_BRANCH',
  },
};

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly configService: ConfigService) { }

  /**
   * Verifies the GitHub HMAC-SHA256 signature to ensure authenticity.
   */
  verifySignature(rawBody: Buffer, signatureHeader: string): boolean {
    const secret = this.configService.get<string>('DEPLOY_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error(
        'DEPLOY_WEBHOOK_SECRET is not configured in the environment.',
      );
      return false;
    }

    if (!signatureHeader) {
      this.logger.warn(
        'Webhook request is missing X-Hub-Signature-256 header.',
      );
      return false;
    }

    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      this.logger.warn(
        'Invalid signature header format. Expected "sha256=signature"',
      );
      return false;
    }

    const signature = parts[1];
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(rawBody || '').digest('hex');

    const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (calculatedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    // Constant-time comparison to protect against timing attacks
    return crypto.timingSafeEqual(calculatedBuffer, signatureBuffer);
  }

  /**
   * Triggers the deployment for a registered target in a non-blocking
   * background child process.
   *
   * @param target — a key from DEPLOY_REGISTRY (e.g. "backend", "frontend", "website-1")
   */
  deploy(target: string): void {
    const entry = DEPLOY_REGISTRY[target];
    if (!entry) {
      this.logger.error(
        `Unknown deployment target "${target}". Register it in DEPLOY_REGISTRY.`,
      );
      return;
    }

    const targetDir = this.configService.get<string>(entry.dirKey);
    const command = this.configService.get<string>(entry.cmdKey);

    if (!targetDir || !command) {
      this.logger.error(
        `Deployment config for "${target}" is incomplete. ` +
        `Check env vars: ${entry.dirKey}, ${entry.cmdKey}`,
      );
      return;
    }

    this.logger.log(`Starting deployment process for "${target}"...`);

    // Ensure logs directory exists
    const logFilePath = path.join(
      process.cwd(),
      'logs',
      `deploy-${target}.log`,
    );
    const logsDir = path.dirname(logFilePath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Append initiation record to log file
    const timestamp = new Date().toISOString();
    fs.appendFileSync(
      logFilePath,
      `\n\n==================================================\n` +
      `🚀 DEPLOYMENT INITIATED: ${timestamp}\n` +
      `📁 Directory: ${targetDir}\n` +
      `💻 Command: ${command}\n` +
      `==================================================\n`,
    );

    // Spawn shell command asynchronously (non-blocking)
    const child = exec(command, { cwd: targetDir });

    child.stdout?.on('data', (data) => {
      fs.appendFileSync(logFilePath, data.toString());
    });

    child.stderr?.on('data', (data) => {
      fs.appendFileSync(logFilePath, data.toString());
    });

    child.on('close', (code) => {
      const finishTime = new Date().toISOString();
      if (code === 0) {
        fs.appendFileSync(
          logFilePath,
          `\n✅ DEPLOYMENT SUCCESSFUL AT ${finishTime} (Exit Code: 0)\n`,
        );
        this.logger.log(`Deployment for "${target}" completed successfully.`);
      } else {
        fs.appendFileSync(
          logFilePath,
          `\n❌ DEPLOYMENT FAILED AT ${finishTime} (Exit Code: ${code})\n`,
        );
        this.logger.error(
          `Deployment for "${target}" failed with code ${code}. ` +
          `Check logs/deploy-${target}.log for details.`,
        );
      }
    });
  }
}
