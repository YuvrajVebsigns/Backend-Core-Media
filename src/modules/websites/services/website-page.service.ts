import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebsitePage } from '../schemas/website-page.schema';
import { CreatePageDto, QueryPageDto } from '../dto/create-page.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { PageStatus } from '../enums/page-status.enum';
import { SlugService } from './slug.service';
import { SectionService } from './section.service';
import { SeoService } from './seo.service';
import { WebsiteCacheService } from './website-cache.service';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';

@Injectable()
export class WebsitePageService {
  constructor(
    @InjectModel(WebsitePage.name) private readonly pageModel: Model<WebsitePage>,
    private readonly slugService: SlugService,
    private readonly sectionService: SectionService,
    private readonly seoService: SeoService,
    private readonly cacheService: WebsiteCacheService,
  ) { }

  private async unsetHomepageForSite(siteId: string): Promise<void> {
    await this.pageModel.updateMany(
      { siteId: siteId as any, isHomepage: true, isDeleted: null },
      { $set: { isHomepage: false } },
    );
  }

  async create(createDto: CreatePageDto, userId: string): Promise<WebsitePage> {
    if (createDto.sections) {
      this.sectionService.validateSections(createDto.sections);
      createDto.sections = this.sectionService.reorderSections(createDto.sections);
    }

    if (createDto.seo) {
      createDto.seo = this.seoService.processAndValidateSeo(createDto.seo);
    }

    const slug = createDto.slug
      ? await this.slugService.generateUniqueSlug(createDto.siteId, createDto.slug)
      : await this.slugService.generateUniqueSlug(createDto.siteId, createDto.title);

    if (createDto.isHomepage) {
      await this.unsetHomepageForSite(createDto.siteId);
    }

    const page = new this.pageModel({
      ...createDto,
      slug,
      createdBy: userId,
      publishedAt: createDto.status === PageStatus.PUBLISHED ? new Date() : null,
    });

    const saved = await page.save();
    await this.cacheService.invalidatePage(createDto.siteId, saved.slug);
    return saved;
  }

  async findAll(queryDto: QueryPageDto): Promise<PaginatedResponseDto<WebsitePage>> {
    const { siteId, search, status, pageType, page = 1, limit = 10, sort } = queryDto;
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: null };

    if (siteId) query.siteId = siteId;
    if (status) query.status = status;
    if (pageType) query.pageType = pageType;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder: any = {};
    if (sort) {
      const parts = sort.split(':');
      sortOrder[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sortOrder.createdAt = -1;
    }

    const [data, total] = await Promise.all([
      this.pageModel.find(query).sort(sortOrder).skip(skip).limit(limit).exec(),
      this.pageModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<WebsitePage> {
    const page = await this.pageModel.findOne({ _id: id, isDeleted: null }).exec();
    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }
    return page;
  }

  async findBySlug(siteId: string, slug: string, skipCache = false): Promise<WebsitePage> {
    if (!skipCache) {
      const cached = await this.cacheService.getPage(siteId, slug);
      if (cached) return cached;
    }

    const page = await this.pageModel
      .findOne({ siteId: siteId as any, slug, isDeleted: null })
      .exec();

    if (!page) {
      throw new NotFoundException(`Page with slug '${slug}' not found for this website`);
    }

    if (!skipCache && page.status === PageStatus.PUBLISHED) {
      await this.cacheService.setPage(siteId, slug, page);
    }

    return page;
  }

  async update(id: string, updateDto: UpdatePageDto, userId: string): Promise<WebsitePage> {
    const existing = await this.findOne(id);

    if (updateDto.sections) {
      this.sectionService.validateSections(updateDto.sections);
      updateDto.sections = this.sectionService.reorderSections(updateDto.sections);
    }

    if (updateDto.seo) {
      updateDto.seo = this.seoService.processAndValidateSeo(updateDto.seo);
    }

    if (updateDto.slug && updateDto.slug !== existing.slug) {
      updateDto.slug = await this.slugService.generateUniqueSlug(
        updateDto.siteId || existing.siteId.toString(),
        updateDto.slug,
        id,
      );
    }

    if (updateDto.isHomepage && !existing.isHomepage) {
      await this.unsetHomepageForSite(updateDto.siteId || existing.siteId.toString());
    }

    const updateData: any = { ...updateDto, updatedBy: userId };

    if (updateDto.status !== undefined && updateDto.status !== existing.status) {
      if (updateDto.status === PageStatus.PUBLISHED) {
        updateData.publishedAt = new Date();
      } else if (
        updateDto.status === PageStatus.DRAFT ||
        updateDto.status === PageStatus.ARCHIVED
      ) {
        updateData.publishedAt = null;
      }
    }

    const updated = await this.pageModel
      .findOneAndUpdate(
        { _id: id },
        updateData,
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    await this.cacheService.invalidatePage(existing.siteId.toString(), existing.slug);
    if (updated.slug !== existing.slug) {
      await this.cacheService.invalidatePage(existing.siteId.toString(), updated.slug);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.pageModel.updateOne({ _id: id }, { isDeleted: new Date() }).exec();
    await this.cacheService.invalidatePage(existing.siteId.toString(), existing.slug);
  }

  async publish(id: string, userId: string): Promise<WebsitePage> {
    const page = await this.findOne(id);
    page.status = PageStatus.PUBLISHED;
    page.publishedAt = new Date();
    page.updatedBy = userId as any;
    const saved = await page.save();

    await this.cacheService.invalidatePage(page.siteId.toString(), page.slug);
    return saved;
  }

  async unpublish(id: string, userId: string): Promise<WebsitePage> {
    const page = await this.findOne(id);
    page.status = PageStatus.DRAFT;
    page.publishedAt = null as any;
    page.updatedBy = userId as any;
    const saved = await page.save();

    await this.cacheService.invalidatePage(page.siteId.toString(), page.slug);
    return saved;
  }

  async duplicate(id: string, userId: string): Promise<WebsitePage> {
    const page = await this.findOne(id);

    const newTitle = `${page.title} (Copy)`;
    const newSlug = await this.slugService.generateUniqueSlug(page.siteId.toString(), `${page.slug}-copy`);

    const duplicated = new this.pageModel({
      siteId: page.siteId,
      title: newTitle,
      slug: newSlug,
      shortDescription: page.shortDescription,
      content: page.content,
      pageType: page.pageType,
      status: PageStatus.DRAFT,
      featuredImageId: page.featuredImageId,
      sections: page.sections,
      isHomepage: false,
      seo: page.seo,
      createdBy: userId,
    });

    return duplicated.save();
  }

  async findAllForWebsite(siteId: string): Promise<Partial<WebsitePage>[]> {
    return this.pageModel
      .find({ siteId: siteId as any, status: PageStatus.PUBLISHED, isDeleted: null })
      .sort({ createdAt: -1 })
      .select('title slug isHomepage status pageType createdAt updatedAt')
      .exec();
  }

  async findBySlugForWebsite(siteId: string, slug: string, skipCache = false): Promise<WebsitePage> {
    if (!skipCache) {
      const cached = await this.cacheService.getPage(siteId, slug);
      if (cached) return cached;
    }

    const page = await this.pageModel
      .findOne({ siteId: siteId as any, status: PageStatus.PUBLISHED, slug, isDeleted: null })
      .exec();

    if (!page) {
      throw new NotFoundException(`Page with slug '${slug}' not found for this website`);
    }

    if (!skipCache && page.status === PageStatus.PUBLISHED) {
      await this.cacheService.setPage(siteId, slug, page);
    }

    return page;
  }
}

