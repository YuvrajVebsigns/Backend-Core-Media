import { ApiProperty } from '@nestjs/swagger';

export class DeploymentTargetResponseDto {
  @ApiProperty({
    example: 'backend',
    description: 'The unique identifier for the deployment target',
  })
  id: string;

  @ApiProperty({
    example: 'Backend Server',
    description: 'Friendly name of the deployment target',
  })
  name: string;

  @ApiProperty({ example: 'refs/heads/main', description: 'Target git branch' })
  branch: string;

  @ApiProperty({
    example: '/var/www/core-media/backend',
    description: 'Source code directory',
  })
  directory: string;

  @ApiProperty({
    example: 'npm run build',
    description: 'Command to build/restart the deployment',
  })
  command: string;

  @ApiProperty({
    example: 'core-media-backend',
    description: 'The PM2 process name associated with this target',
  })
  pm2ProcessName: string;

  @ApiProperty({
    example: true,
    description: 'Whether the target is active (applicable for websites)',
  })
  isActive: boolean;

  @ApiProperty({
    example: '69f99ff491d02a6688df9747',
    required: false,
    description: 'Website ID in database if applicable',
  })
  websiteId?: string;

  @ApiProperty({
    example: 'success',
    enum: ['idle', 'deploying', 'success', 'failed'],
    description: 'Last deployment status',
  })
  status: 'idle' | 'deploying' | 'success' | 'failed';

  @ApiProperty({
    example: '2026-07-02T16:12:15Z',
    required: false,
    description: 'Last deployment initiation timestamp',
  })
  lastDeployed?: string;
}

export class Pm2ProcessResponseDto {
  @ApiProperty({
    example: 'core-media-backend',
    description: 'Name of the process in PM2',
  })
  name: string;

  @ApiProperty({
    example: 12345,
    required: false,
    description: 'Process ID on OS level',
  })
  pid?: number;

  @ApiProperty({ example: 0, description: 'PM2 process ID' })
  pm_id: number;

  @ApiProperty({
    example: 'online',
    description: 'Status of the process (e.g. online, stopped, errored)',
  })
  status: string;

  @ApiProperty({ example: 0.5, description: 'CPU usage in percentage' })
  cpu: number;

  @ApiProperty({ example: 85000000, description: 'Memory usage in bytes' })
  memory: number;

  @ApiProperty({
    example: 86400,
    description: 'Uptime of the process in seconds',
  })
  uptime: number;

  @ApiProperty({
    example: 2,
    description: 'Number of times the process has restarted',
  })
  restarts: number;
}

export class LogResponseDto {
  @ApiProperty({ example: 'backend', description: 'Target identifier' })
  target: string;

  @ApiProperty({
    example: 'Deployment initiated...\n',
    description: 'The text content of the logs',
  })
  logs: string;
}
