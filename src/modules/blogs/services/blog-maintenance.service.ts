import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog } from '../schemas/blog.schema';
import { BlogStatus } from '../enums/blog-status.enum';

/**
 * Periodically checks for:
 * 1. Scheduled blogs that need to be published.
 * 2. Published blogs that reached their auto-archive date.
 */
@Injectable()
export class BlogMaintenanceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BlogMaintenanceService.name);

  constructor(@InjectModel(Blog.name) private blogModel: Model<Blog>) {}

  onApplicationBootstrap() {
    // Run maintenance every hour (3600000 ms)
    setInterval(() => this.runMaintenance(), 3600000);
    
    // Also run 10 seconds after startup
    setTimeout(() => this.runMaintenance(), 10000);
  }

  async runMaintenance() {
    const now = new Date();
    this.logger.debug('Running blog maintenance sweep...');

    try {
      // 1. Process Scheduled Blogs
      const scheduledResult = await this.blogModel.updateMany(
        {
          status: BlogStatus.SCHEDULED,
          scheduledAt: { $lte: now, $ne: null },
          isDeleted: null,
        },
        {
          $set: {
            status: BlogStatus.PUBLISHED,
            isActive: true,
            publishedAt: now,
          },
        }
      ).exec();

      if (scheduledResult.modifiedCount > 0) {
        this.logger.log(`Maintenance: Published ${scheduledResult.modifiedCount} scheduled blogs.`);
      }

      // 2. Process Auto-Archival
      const archiveResult = await this.blogModel.updateMany(
        {
          status: BlogStatus.PUBLISHED,
          autoArchiveAt: { $lte: now, $ne: null },
          isDeleted: null,
        },
        {
          $set: {
            status: BlogStatus.ARCHIVED,
            isActive: false,
          },
        }
      ).exec();

      if (archiveResult.modifiedCount > 0) {
        this.logger.log(`Maintenance: Archived ${archiveResult.modifiedCount} blogs based on duration rules.`);
      }
    } catch (error) {
      this.logger.error('Error during blog maintenance sweep', error.stack);
    }
  }
}
