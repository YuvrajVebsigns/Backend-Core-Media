import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { SystemUserRole } from '@common/enums/role.enum';
import { DeploymentsService } from './deployments.service';
import {
  DeploymentTargetResponseDto,
  Pm2ProcessResponseDto,
  LogResponseDto,
} from './dto/deployment.dto';
import { ApiStandardResponse } from '@common/decorators/api-standard-response.decorator';

@ApiTags('Admin | Deployments')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid credentials or missing token',
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - Super Admin role required',
})
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SystemUserRole.SUPER_ADMIN)
@Controller('admin/deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get('targets')
  @ApiOperation({ summary: 'Get list of all deployment targets' })
  @ApiStandardResponse({
    status: 200,
    description: 'List of targets retrieved successfully',
    type: DeploymentTargetResponseDto,
    isArray: true,
  })
  async getTargets(): Promise<DeploymentTargetResponseDto[]> {
    return this.deploymentsService.getTargets();
  }

  @Post('deploy/:target')
  @ApiOperation({
    summary: 'Trigger code deployment for a target in the background',
  })
  @ApiStandardResponse({
    status: 200,
    description: 'Deployment initiated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Target not active or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Deployment target not recognized',
  })
  async triggerDeploy(@Param('target') target: string) {
    return this.deploymentsService.triggerDeploy(target);
  }

  @Get('deploy-logs/:target')
  @ApiOperation({ summary: 'Get the latest deployment logs for a target' })
  @ApiStandardResponse({
    status: 200,
    description: 'Deployment logs retrieved successfully',
    type: LogResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Target invalid' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Target or deployment log file not found',
  })
  async getDeployLogs(
    @Param('target') target: string,
  ): Promise<LogResponseDto> {
    const logs = await this.deploymentsService.getDeployLogs(target);
    return { target, logs };
  }

  @Get('pm2-status')
  @ApiOperation({ summary: 'Get status of PM2 processes' })
  @ApiStandardResponse({
    status: 200,
    description: 'PM2 process status retrieved successfully',
    type: Pm2ProcessResponseDto,
    isArray: true,
  })
  async getPm2Status(): Promise<Pm2ProcessResponseDto[]> {
    return this.deploymentsService.getPm2Status();
  }

  @Get('pm2-logs/:target')
  @ApiOperation({ summary: 'Get PM2 console logs for a target process' })
  @ApiStandardResponse({
    status: 200,
    description: 'PM2 logs retrieved successfully',
    type: LogResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Target invalid' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Process or logs not found',
  })
  async getPm2Logs(@Param('target') target: string): Promise<LogResponseDto> {
    const logs = await this.deploymentsService.getPm2Logs(target);
    return { target, logs };
  }

  @Post('restart/:target')
  @ApiOperation({ summary: 'Trigger a PM2 restart for a target process' })
  @ApiStandardResponse({
    status: 200,
    description: 'Process restart triggered successfully',
    type: LogResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Target invalid or inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Process not found or failed to restart',
  })
  async restartPm2(@Param('target') target: string): Promise<LogResponseDto> {
    const logs = await this.deploymentsService.restartPm2(target);
    return { target, logs };
  }

  @Get('restart-logs/:target')
  @ApiOperation({ summary: 'Get PM2 restart command log output for a target' })
  @ApiStandardResponse({
    status: 200,
    description: 'Process restart command logs retrieved successfully',
    type: LogResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Target invalid' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Restart command log file not found',
  })
  async getRestartLogs(
    @Param('target') target: string,
  ): Promise<LogResponseDto> {
    const logs = await this.deploymentsService.getRestartLogs(target);
    return { target, logs };
  }
}
