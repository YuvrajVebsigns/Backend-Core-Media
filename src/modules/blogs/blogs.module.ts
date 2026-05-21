import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { WebsiteBlogsController } from './website-blogs.controller';
import { Blog, BlogSchema } from './schemas/blog.schema';
import { BlogComment, BlogCommentSchema } from './schemas/comment.schema';
import { BlogMaintenanceService } from './services/blog-maintenance.service';
import { BlogEngagementProcessor } from './processors/blog-engagement.processor';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: BlogComment.name, schema: BlogCommentSchema },
    ]),
    BullModule.registerQueue({
      name: 'blog-engagement',
    }),
    AuthModule,
  ],
  controllers: [BlogsController, WebsiteBlogsController],
  providers: [BlogsService, BlogMaintenanceService, BlogEngagementProcessor],
  exports: [BlogsService],
})
export class BlogsModule { }
