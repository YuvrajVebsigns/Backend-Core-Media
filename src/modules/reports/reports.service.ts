import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report } from './schemas/report.schema';
import { Registree } from '@modules/attendees/schemas/registree.schema';
import { FilesService } from '@core/files/services/files.service';
import { FileVisibility } from '@core/files/enums/visibility.enum';
import {
  CreateReportDto,
  UpdateReportDto,
  QueryReportDto,
  DownloadReportDto,
} from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    @InjectModel(Registree.name) private readonly registreeModel: Model<Registree>,
    private readonly filesService: FilesService,
  ) {}

  // ─── Admin Operations ──────────────────────────────────────────────────────

  async create(createDto: CreateReportDto, userId: string): Promise<Report> {
    // Check if slug is unique
    const existing = await this.reportModel
      .findOne({ slug: createDto.slug, isDeleted: null })
      .exec();
    if (existing) {
      throw new BadRequestException(
        `Report with slug "${createDto.slug}" already exists`,
      );
    }

    // Verify fileId is valid
    try {
      await this.filesService.findById(createDto.fileId);
    } catch {
      throw new NotFoundException(`File with ID "${createDto.fileId}" not found`);
    }

    const report = new this.reportModel({
      ...createDto,
      fileId: new Types.ObjectId(createDto.fileId),
      websiteId: createDto.websiteId
        ? new Types.ObjectId(createDto.websiteId)
        : undefined,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });

    const saved = await report.save();
    return this.findOne(saved.id);
  }

  async update(
    id: string,
    updateDto: UpdateReportDto,
    userId: string,
  ): Promise<Report> {
    const report = await this.reportModel
      .findOne({ _id: id, isDeleted: null })
      .exec();
    if (!report) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }

    if (updateDto.slug && updateDto.slug !== report.slug) {
      const existing = await this.reportModel
        .findOne({ slug: updateDto.slug, isDeleted: null })
        .exec();
      if (existing) {
        throw new BadRequestException(
          `Report with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    if (updateDto.fileId) {
      try {
        await this.filesService.findById(updateDto.fileId);
      } catch {
        throw new NotFoundException(`File with ID "${updateDto.fileId}" not found`);
      }
    }

    const updateData: any = {
      ...updateDto,
      updatedBy: new Types.ObjectId(userId),
    };

    if (updateDto.fileId) {
      updateData.fileId = new Types.ObjectId(updateDto.fileId);
    }
    if (updateDto.websiteId) {
      updateData.websiteId = new Types.ObjectId(updateDto.websiteId);
    }

    await this.reportModel.updateOne({ _id: id }, { $set: updateData }).exec();
    return this.findOne(id);
  }

  async findAll(query: QueryReportDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: null };

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.websiteId) {
      filter.websiteId = new Types.ObjectId(query.websiteId);
    }

    if (query.isPublished !== undefined) {
      filter.isPublished = query.isPublished === 'true';
    }

    const [data, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .populate('websiteId', 'name domain')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportModel
      .findOne({ _id: id, isDeleted: null })
      .populate('websiteId', 'name domain')
      .exec();

    if (!report) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }

    return report;
  }

  async findBySlug(slug: string): Promise<Report> {
    const report = await this.reportModel
      .findOne({ slug, isDeleted: null, isPublished: true })
      .populate('websiteId', 'name domain')
      .exec();

    if (!report) {
      throw new NotFoundException(`Report with slug "${slug}" not found`);
    }

    return report;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reportModel
      .updateOne({ _id: id, isDeleted: null }, { $set: { isDeleted: new Date() } })
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }
  }

  // ─── Website Operations ────────────────────────────────────────────────────

  async downloadReport(downloadDto: DownloadReportDto, websiteId?: string) {
    const report = await this.reportModel
      .findOne({ _id: downloadDto.reportId, isDeleted: null, isPublished: true })
      .exec();
    if (!report) {
      throw new NotFoundException(
        `Report with ID "${downloadDto.reportId}" not found or not published`,
      );
    }

    const email = downloadDto.email.trim().toLowerCase();

    // Check if user already exists in registrees
    let registree = await this.registreeModel
      .findOne({ email, isDeleted: null })
      .exec();

    const reportDetail = {
      reportId: report._id,
      downloadedAt: new Date(),
      firstName: downloadDto.firstName,
      lastName: downloadDto.lastName,
      companyName: downloadDto.companyName,
      designation: downloadDto.designation,
      industry: downloadDto.industry,
      phoneNumber: downloadDto.phoneNumber,
      countryCode: downloadDto.countryCode,
    };

    if (registree) {
      // User exists. DO NOT update root fields (name, phone, organization, etc.).
      // Add the tag 'reportDownload' if not already present
      if (!registree.tags) {
        registree.tags = ['reportDownload'];
      } else if (!registree.tags.includes('reportDownload')) {
        registree.tags.push('reportDownload');
        registree.markModified('tags');
      }

      registree.downloadedReports = registree.downloadedReports || [];
      registree.downloadedReports.push(reportDetail);
      registree.markModified('downloadedReports');
    } else {
      // User does not exist. Create new Registree.
      // Use ONLY 'reportDownload' tag as requested.
      registree = new this.registreeModel({
        name: `${downloadDto.firstName} ${downloadDto.lastName}`,
        email,
        phoneNumber: downloadDto.phoneNumber,
        countryCode: downloadDto.countryCode,
        organization: downloadDto.companyName,
        tags: ['reportDownload'],
        websiteId: websiteId ? new Types.ObjectId(websiteId) : undefined,
        downloadedReports: [reportDetail],
      });
    }

    await registree.save();

    // Increment download count on report
    await this.reportModel
      .updateOne({ _id: report._id }, { $inc: { downloadCount: 1 } })
      .exec();

    // Retrieve file to verify private visibility vs public URL
    const fileDoc = await this.filesService.findById(report.fileId.toString());

    let downloadUrl: string;
    if (fileDoc.visibility === FileVisibility.PRIVATE) {
      const signedResult = await this.filesService.getSignedUrl(
        fileDoc.id.toString(),
        3600, // 1 hour link expiry
      );
      downloadUrl = signedResult.signedUrl;
    } else {
      const fileRes = this.filesService.mapToResponse(fileDoc);
      downloadUrl = fileRes.url;
    }

    return {
      downloadUrl,
      reportTitle: report.title,
      reportSlug: report.slug,
    };
  }

  async findDownloaders(reportId: string) {
    const registrees = await this.registreeModel
      .find({
        'downloadedReports.reportId': new Types.ObjectId(reportId),
        isDeleted: null,
      })
      .select('name email phoneNumber countryCode organization downloadedReports')
      .exec();

    const downloaders = registrees.map((reg) => {
      const downloads = reg.downloadedReports || [];
      const match = downloads.find((d) => d.reportId && d.reportId.toString() === reportId);
      return {
        registreeId: reg._id.toString(),
        email: reg.email,
        name: match ? `${match.firstName} ${match.lastName}` : reg.name,
        firstName: match?.firstName || '',
        lastName: match?.lastName || '',
        companyName: match?.companyName || reg.organization || '',
        designation: match?.designation || '',
        industry: match?.industry || '',
        phoneNumber: match?.phoneNumber || reg.phoneNumber || '',
        countryCode: match?.countryCode || reg.countryCode || '',
        downloadedAt: match?.downloadedAt || reg.createdAt,
      };
    });

    downloaders.sort((a, b) => {
      const dateA = a.downloadedAt instanceof Date ? a.downloadedAt.getTime() : new Date(a.downloadedAt).getTime();
      const dateB = b.downloadedAt instanceof Date ? b.downloadedAt.getTime() : new Date(b.downloadedAt).getTime();
      return dateB - dateA;
    });

    return downloaders;
  }
}

