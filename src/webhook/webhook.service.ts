import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly configService: ConfigService) { }

  /**
   * Verifies the GitHub signature of incoming webhooks to ensure authenticity.
   */
  verifySignature(rawBody: Buffer, signatureHeader: string): boolean {
    const secret = this.configService.get<string>('DEPLOY_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('DEPLOY_WEBHOOK_SECRET is not configured in the environment.');
      return false;
    }

    if (!signatureHeader) {
      this.logger.warn('Webhook request is missing X-Hub-Signature-256 header.');
      return false;
    }

    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      this.logger.warn('Invalid signature header format. Expected "sha256=signature"');
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

    // Protect against timing attacks using constant-time comparison
    return crypto.timingSafeEqual(calculatedBuffer, signatureBuffer);
  }

  /**
   * Triggers the deployment of frontend or backend in a non-blocking background child process.
   */
  deploy(repo: 'backend' | 'frontend'): void {
    const isBackend = repo === 'backend';
    const targetDir = this.configService.get<string>(isBackend ? 'DEPLOY_BACKEND_DIR' : 'DEPLOY_FRONTEND_DIR');
    const command = this.configService.get<string>(isBackend ? 'DEPLOY_BACKEND_CMD' : 'DEPLOY_FRONTEND_CMD');

    if (!targetDir || !command) {
      this.logger.error(`Deployment configurations for ${repo} are incomplete in the environment settings.`);
      return;
    }

    this.logger.log(`Starting deployment process for ${repo}...`);

    // Ensure logs directory exists
    const logFilePath = path.join(process.cwd(), 'logs', `deploy-${repo}.log`);
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
      `==================================================\n`
    );

    // Asynchronously spawn shell to execute git pull and build commands
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
          `\n✅ DEPLOYMENT SUCCESSFUL AT ${finishTime} (Exit Code: 0)\n`
        );
        this.logger.log(`Deployment for ${repo} completed successfully.`);
      } else {
        fs.appendFileSync(
          logFilePath,
          `\n❌ DEPLOYMENT FAILED AT ${finishTime} (Exit Code: ${code})\n`
        );
        this.logger.error(`Deployment for ${repo} failed with code ${code}. Check logs/deploy-${repo}.log for details.`);
      }
    });
  }
}
