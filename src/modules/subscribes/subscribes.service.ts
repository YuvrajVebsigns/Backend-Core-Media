import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscribe } from './schemas/subscribe.schema';
import { CreateSubscribeDto, QuerySubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubscribesService {
  constructor(
    @InjectModel(Subscribe.name) private readonly subscribeModel: Model<Subscribe>,
  ) {}

  async create(createDto: CreateSubscribeDto, websiteId: string): Promise<Subscribe> {
    const matchQuery: any = {
      email: createDto.email,
      websiteId: new Types.ObjectId(websiteId),
    };
    const existing = await this.subscribeModel.findOne(matchQuery).exec();
    if (existing) return existing;

    const doc = new this.subscribeModel({
      email: createDto.email,
      source: createDto.source,
      websiteId: new Types.ObjectId(websiteId),
      subscribedAt: new Date(),
    });

    return doc.save();
  }

  async findAll(queryDto: QuerySubscribeDto) {
    const { page = 1, limit = 10, search, websiteId } = queryDto as any;
    const skip = (page - 1) * limit;

    const matchQuery: any = {};
    if (websiteId) matchQuery.websiteId = new Types.ObjectId(websiteId);
    if (search) matchQuery.email = { $regex: search, $options: 'i' };

    const [data, total] = await Promise.all([
      this.subscribeModel
        .find(matchQuery)
        .populate('websiteId', 'name domain')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.subscribeModel.countDocuments(matchQuery).exec(),
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

  async findOne(id: string): Promise<Subscribe> {
    const sub = await this.subscribeModel.findById(id).populate('websiteId', 'name domain').exec();
    if (!sub) throw new NotFoundException(`Subscribe entry with ID ${id} not found`);
    return sub;
  }

  async remove(id: string): Promise<void> {
    const result = await this.subscribeModel.findByIdAndUpdate(id, { isDeleted: new Date() }).exec();
    if (!result) throw new NotFoundException(`Subscribe entry with ID ${id} not found`);
  }
}
