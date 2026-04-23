import { Controller, Get, Param, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { FeatureFlagService, FeatureFlag } from './feature-flag.service';

@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) { }

  @Get()
  @ApiOperation({ summary: 'Get all feature flag statuses' })
  getAllFlags() {
    return this.featureFlagService.getAllFlags();
  }

  @Get(':flag')
  @ApiOperation({ summary: 'Check if a specific feature flag is enabled' })
  @ApiParam({ name: 'flag', enum: FeatureFlag, description: 'Feature flag name' })
  getFlag(@Param('flag') flag: string) {
    return {
      flag,
      enabled: this.featureFlagService.isEnabled(flag),
    };
  }

  @Post(':flag/enable')
  @ApiOperation({ summary: 'Enable a feature flag at runtime' })
  @ApiParam({ name: 'flag', enum: FeatureFlag })
  enableFlag(@Param('flag') flag: string) {
    this.featureFlagService.enable(flag);
    return { flag, enabled: true, message: `Feature ${flag} has been enabled` };
  }

  @Post(':flag/disable')
  @ApiOperation({ summary: 'Disable a feature flag at runtime' })
  @ApiParam({ name: 'flag', enum: FeatureFlag })
  disableFlag(@Param('flag') flag: string) {
    this.featureFlagService.disable(flag);
    return { flag, enabled: false, message: `Feature ${flag} has been disabled` };
  }

  @Delete(':flag/override')
  @ApiOperation({ summary: 'Reset a feature flag to its env default' })
  @ApiParam({ name: 'flag', enum: FeatureFlag })
  resetFlag(@Param('flag') flag: string) {
    this.featureFlagService.resetOverride(flag);
    return {
      flag,
      enabled: this.featureFlagService.isEnabled(flag),
      message: `Feature ${flag} has been reset to environment default`,
    };
  }
}
