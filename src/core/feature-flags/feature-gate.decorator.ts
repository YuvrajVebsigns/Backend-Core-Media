import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';

/**
 * Decorator to gate a route behind a feature flag.
 * If the flag is disabled, the route returns 404.
 *
 * Usage:
 *   @FeatureGate(FeatureFlag.BETA_API)
 *   @Get('beta-endpoint')
 *   betaEndpoint() { ... }
 */
export const FeatureGate = (flag: string) =>
  SetMetadata(FEATURE_FLAG_KEY, flag);
