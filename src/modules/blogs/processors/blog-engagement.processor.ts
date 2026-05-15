import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Blog } from '../schemas/blog.schema';

@Processor('blog-engagement')
export class BlogEngagementProcessor {
  private readonly logger = new Logger(BlogEngagementProcessor.name);

  constructor(
    @InjectModel(Blog.name) private blogModel: Model<Blog>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Process('sync-engagement')
  async handleSyncEngagement(job: Job<{ blogId: string }>) {
    const { blogId } = job.data;
    
    try {
      // Keys for buffered engagement
      const likesKey = `blog:engagement:${blogId}:likes`;
      const viewsKey = `blog:engagement:${blogId}:views`;
      const commentsKey = `blog:engagement:${blogId}:comments`;

      // Get accumulated counts
      const [likesResult, viewsResult, commentsResult] = await Promise.all([
        this.cacheManager.get<number>(likesKey),
        this.cacheManager.get<number>(viewsKey),
        this.cacheManager.get<number>(commentsKey),
      ]);

      const likes = likesResult || 0;
      const views = viewsResult || 0;
      const commentsCount = commentsResult || 0;

      if (likes === 0 && views === 0 && commentsCount === 0) {
        return;
      }

      // Update Database once for all accumulated metrics
      await this.blogModel.findByIdAndUpdate(blogId, {
        $inc: {
          'engagement.likes': likes,
          'engagement.views': views,
          'engagement.commentsCount': commentsCount,
        },
      });

      // Reset counters in cache
      await Promise.all([
        this.cacheManager.del(likesKey),
        this.cacheManager.del(viewsKey),
        this.cacheManager.del(commentsKey),
      ]);

      this.logger.log(`Synced engagement for blog ${blogId}: Likes +${likes}, Views +${views}, Comments +${commentsCount}`);
    } catch (error) {
      this.logger.error(`Failed to sync engagement for blog ${blogId}`, error.stack);
      throw error;
    }
  }
}
