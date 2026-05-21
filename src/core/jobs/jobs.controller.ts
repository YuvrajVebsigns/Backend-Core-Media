import { Controller, Post, Body } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';

class EmailJobDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;
}

@ApiTags('Admin | Background Jobs')
@Controller('admin/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('email')
  @ApiOperation({ summary: 'Dispatch a background email job (Non-blocking)' })
  async triggerEmail(@Body() body: EmailJobDto) {
    await this.jobsService.sendWelcomeEmail(body.email, body.name);
    return { message: 'Email job dispatched to the queue successfully' };
  }
}
