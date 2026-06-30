import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ──────────────────────────────────────────────
// Define all feature flags here
// ──────────────────────────────────────────────
export enum FeatureFlag {
  NEW_DASHBOARD = 'FEATURE_NEW_DASHBOARD',
  DARK_MODE = 'FEATURE_DARK_MODE',
  BETA_API = 'FEATURE_BETA_API',
  EMAIL_NOTIFICATIONS = 'FEATURE_EMAIL_NOTIFICATIONS',
  IMAGE_PROCESSING = 'FEATURE_IMAGE_PROCESSING',
  SOCIAL_LOGIN = 'FEATURE_SOCIAL_LOGIN',
  EMAIL_PROVIDER_BREVO = 'FEATURE_EMAIL_PROVIDER_BREVO',
  EMAIL_PROVIDER_SENDGRID = 'FEATURE_EMAIL_PROVIDER_SENDGRID',
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  // In-memory runtime overrides (for dynamic toggling without restart)
  private readonly runtimeOverrides = new Map<string, boolean>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Check if a feature is enabled.
   * Priority: runtime override > environment variable > default (false)
   */
  isEnabled(flag: FeatureFlag | string): boolean {
    // 1. Check runtime overrides first
    if (this.runtimeOverrides.has(flag)) {
      return this.runtimeOverrides.get(flag)!;
    }

    // 2. Check environment variable
    const envValue = this.configService.get<string>(flag);
    if (envValue !== undefined) {
      return envValue === 'true' || envValue === '1';
    }

    // 3. Default: disabled
    return false;
  }

  /**
   * Enable a feature at runtime (no restart needed)
   */
  enable(flag: FeatureFlag | string): void {
    this.runtimeOverrides.set(flag, true);
    this.logger.log(`🟢 Feature enabled: ${flag}`);
  }

  /**
   * Disable a feature at runtime (no restart needed)
   */
  disable(flag: FeatureFlag | string): void {
    this.runtimeOverrides.set(flag, false);
    this.logger.log(`🔴 Feature disabled: ${flag}`);
  }

  /**
   * Remove a runtime override (fall back to env config)
   */
  resetOverride(flag: FeatureFlag | string): void {
    this.runtimeOverrides.delete(flag);
    this.logger.log(`🔄 Feature reset to env default: ${flag}`);
  }

  /**
   * Get the status of all known feature flags
   */
  getAllFlags(): Record<string, boolean> {
    const flags: Record<string, boolean> = {};
    for (const key of Object.values(FeatureFlag)) {
      flags[key] = this.isEnabled(key);
    }
    return flags;
  }
}
