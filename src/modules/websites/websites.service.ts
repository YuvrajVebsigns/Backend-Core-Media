import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Website } from './schemas/website.schema';
import {
  CreateWebsiteDto,
  UpdateWebsiteDto,
  QueryWebsiteDto,
} from './dto/website.dto';
import { PaginatedResponseDto } from '@common/dto/paginated-response.dto';

@Injectable()
export class WebsitesService {
  constructor(
    @InjectModel(Website.name) private websiteModel: Model<Website>,
    private readonly jwtService: JwtService,
  ) {}

  private sanitizeImageUrls(dto: any) {
    if (dto.logoId && dto.logo?.startsWith('http')) {
      delete dto.logo;
    }
    if (dto.seo?.ogImageId && dto.seo?.ogImage?.startsWith('http')) {
      delete dto.seo.ogImage;
    }
  }

  async create(createDto: CreateWebsiteDto): Promise<Website> {
    const { slug, domain } = createDto;

    const existingSlug = await this.websiteModel.findOne({ slug });
    if (existingSlug) {
      throw new ConflictException('Website with this slug already exists');
    }

    const existingDomain = await this.websiteModel.findOne({ domain });
    if (existingDomain) {
      throw new ConflictException('Website with this domain already exists');
    }

    this.sanitizeImageUrls(createDto);

    const newWebsite = new this.websiteModel(createDto);
    return newWebsite.save();
  }

  async findAll(
    queryDto: QueryWebsiteDto,
  ): Promise<PaginatedResponseDto<Website>> {
    const { page = 1, limit = 10, search, isActive, sort } = queryDto;
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (isActive !== undefined) {
      matchQuery.isActive = isActive;
    }

    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption: any = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }

    const [data, total] = await Promise.all([
      this.websiteModel
        .find(matchQuery)
        .populate('logoId')
        .populate('seo.ogImageId')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.websiteModel.countDocuments(matchQuery).exec(),
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

  async findOne(id: string): Promise<Website> {
    const website = await this.websiteModel
      .findOne({ _id: id, isDeleted: null })
      .populate('logoId')
      .populate('seo.ogImageId')
      .exec();
    if (!website) {
      throw new NotFoundException(`Website with ID ${id} not found`);
    }
    return website;
  }

  async update(id: string, updateDto: UpdateWebsiteDto): Promise<Website> {
    this.sanitizeImageUrls(updateDto);

    const website = await this.websiteModel
      .findOneAndUpdate({ _id: id, isDeleted: null }, updateDto, {
        returnDocument: 'after',
      })
      .exec();

    if (!website) {
      throw new NotFoundException(`Website with ID ${id} not found`);
    }

    return website;
  }

  async remove(id: string): Promise<void> {
    const result = await this.websiteModel
      .updateOne({ _id: id }, { isDeleted: new Date() })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Website with ID ${id} not found`);
    }
  }

  async findBySlug(slug: string): Promise<Website | null> {
    return this.websiteModel.findOne({ slug, isDeleted: null }).exec();
  }

  async generateWebsiteToken(
    origin: string,
    fallbackDomain?: string,
  ): Promise<{ token: string; website: Website }> {
    const normalizeDomain = (input: string): string => {
      if (!input) return '';
      let cleaned = input.trim().toLowerCase();
      cleaned = cleaned.replace(/^https?:\/\//i, '');
      cleaned = cleaned.split(':')[0];
      cleaned = cleaned.split('/')[0];
      cleaned = cleaned.replace(/^www\./i, '');
      return cleaned;
    };

    const normalizedOrigin = normalizeDomain(origin);
    let targetDomain = normalizedOrigin;

    // Support both checking the actual origin and allowing header/query/body fallbacks for local development
    if (
      (normalizedOrigin === 'localhost' ||
        normalizedOrigin === '127.0.0.1' ||
        !normalizedOrigin) &&
      fallbackDomain
    ) {
      targetDomain = normalizeDomain(fallbackDomain);
    }

    if (!targetDomain) {
      throw new BadRequestException('Origin domain could not be identified');
    }

    const websites = await this.websiteModel
      .find({ isDeleted: null, isActive: true })
      .exec();
    const matchedWebsite = websites.find(
      (w) => normalizeDomain(w.domain) === targetDomain,
    );

    if (!matchedWebsite) {
      throw new UnauthorizedException(
        `Domain "${targetDomain}" is not registered or active`,
      );
    }

    const payload = {
      websiteId: matchedWebsite._id.toString(),
      domain: matchedWebsite.domain,
      slug: matchedWebsite.slug,
      type: 'website',
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1d' });

    return {
      token,
      website: matchedWebsite,
    };
  }
}
