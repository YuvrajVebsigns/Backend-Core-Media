import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from './feature-flag.service';
import { FEATURE_FLAG_KEY } from './feature-gate.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFlag = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No flag required — allow access
    if (!requiredFlag) {
      return true;
    }

    // Flag is disabled — hide the route entirely (404)
    if (!this.featureFlagService.isEnabled(requiredFlag)) {
      throw new NotFoundException('Resource not found');
    }

    return true;
  }
}
