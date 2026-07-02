import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsitePage } from '../schemas/website-page.schema';
import { generateSlug } from '../utils/slug-generator';

@Injectable()
export class SlugService {
  constructor(
    @InjectModel(WebsitePage.name)
    private readonly pageModel: Model<WebsitePage>,
  ) {}

  async generateUniqueSlug(
    siteId: string,
    title: string,
    excludePageId?: string,
  ): Promise<string> {
    const baseSlug = generateSlug(title);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      const query: any = { siteId, slug: uniqueSlug, isDeleted: null };
      if (excludePageId) {
        query._id = { $ne: excludePageId };
      }

      const exists = await this.pageModel.findOne(query).exec();
      if (!exists) {
        break;
      }

      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }
}
