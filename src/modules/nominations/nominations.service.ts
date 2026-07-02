import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Nomination, NominationStatus } from './schemas/nomination.schema';
import { Registree } from '@modules/attendees/schemas/registree.schema';
import {
  CreateNominationDto,
  UpdateNominationDto,
  UpdateNominationStatusDto,
  QueryNominationDto,
} from './dto/nomination.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AppEvents,
  NominationSubmittedEvent,
  NominationStatusChangedEvent,
} from '@modules/events/event-definitions';

@Injectable()
export class NominationsService {
  constructor(
    @InjectModel(Nomination.name)
    private readonly nominationModel: Model<Nomination>,
    @InjectModel(Registree.name)
    private readonly registreeModel: Model<Registree>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Submit a nomination (website form)
   * 1. Find-or-create Registree for nominator (tag: 'nominator')
   * 2. For each nominee, find-or-create Registree (tag: 'nominee')
   * 3. Enforce max 10 nominees total per nominator email
   * 4. Create the Nomination relationship document
   */
  async create(
    createDto: CreateNominationDto,
    websiteId?: string,
  ): Promise<Nomination> {
    // Step 1: Find or create nominator in registrees
    const nominatorRegistree = await this.findOrCreateRegistree(
      {
        name: createDto.nominatorName,
        email: createDto.nominatorEmail,
        phoneNumber: createDto.nominatorPhone || '',
        organization: createDto.nominatorCompany,
        city: createDto.nominatorCity,
      },
      'nominator',
      websiteId,
    );

    // Step 2: Check if this nominator already has existing nominees — enforce 10 max total
    const existingNominations = await this.nominationModel
      .find({
        nominatorId: nominatorRegistree._id as any,
        isDeleted: null,
      })
      .exec();

    const existingNomineeCount = existingNominations.reduce(
      (acc, nom) => acc + nom.nominees.length,
      0,
    );

    if (existingNomineeCount + createDto.nominees.length > 10) {
      throw new BadRequestException(
        `You can nominate up to 10 CIOs only. You have already nominated ${existingNomineeCount}. ` +
          `You can add ${10 - existingNomineeCount} more.`,
      );
    }

    // Step 3: Find or create registree for each nominee
    const nomineeEntries: {
      nomineeId: Types.ObjectId;
      categoryId: Types.ObjectId;
    }[] = [];

    for (const nominee of createDto.nominees) {
      const nomineeRegistree = await this.findOrCreateRegistree(
        {
          name: nominee.contactName,
          email: nominee.contactEmail,
          phoneNumber: nominee.mobileNo || '',
          organization: nominee.companyName,
        },
        'nominee',
        websiteId,
      );

      nomineeEntries.push({
        nomineeId: nomineeRegistree._id,
        categoryId: new Types.ObjectId(nominee.categoryId),
      });
    }

    // Step 4: Create the nomination document
    const nomination = new this.nominationModel({
      nominatorId: nominatorRegistree._id,
      nominees: nomineeEntries,
      status: NominationStatus.PENDING,
      ...(websiteId ? { websiteId: new Types.ObjectId(websiteId) } : {}),
    });

    const saved = await nomination.save();
    const result = await this.findOne(saved.id);

    this.eventEmitter.emit(
      AppEvents.NOMINATION_SUBMITTED,
      new NominationSubmittedEvent(
        result._id.toString(),
        createDto.nominees?.[0]?.categoryId || '',
        createDto.nominees
          ? createDto.nominees.map((n) => n.contactName).join(', ')
          : '',
        createDto.nominatorEmail,
        websiteId,
      ),
    );

    return result;
  }

  /**
   * Find all unique nominators with aggregated nomination details
   */
  async findAllGroupedByNominator(query: QueryNominationDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (query.status) {
      matchQuery.status = query.status;
    }
    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }

    const pipeline: any[] = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$nominatorId',
          nominationIds: { $push: '$_id' },
          nomineesCount: { $sum: { $size: '$nominees' } },
          statuses: { $addToSet: '$status' },
          submittedAt: { $max: '$createdAt' },
          websiteId: { $first: '$websiteId' },
        },
      },
      {
        $lookup: {
          from: 'registrees',
          localField: '_id',
          foreignField: '_id',
          as: 'nominator',
        },
      },
      { $unwind: '$nominator' },
    ];

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'nominator.name': searchRegex },
            { 'nominator.email': searchRegex },
            { 'nominator.organization': searchRegex },
            { 'nominator.city': searchRegex },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'websites',
              localField: 'websiteId',
              foreignField: '_id',
              as: 'website',
            },
          },
          { $unwind: { path: '$website', preserveNullAndEmptyArrays: true } },
        ],
      },
    });

    const result = await this.nominationModel.aggregate(pipeline).exec();
    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

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

  /**
   * Find all unique nominees with aggregated nomination details
   */
  async findAllGroupedByNominee(query: QueryNominationDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const matchQuery: any = { isDeleted: null };

    if (query.status) {
      matchQuery.status = query.status;
    }
    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }
    if (query.nominatorId) {
      matchQuery.nominatorId = new Types.ObjectId(query.nominatorId);
    }

    const pipeline: any[] = [
      { $match: matchQuery },
      { $unwind: '$nominees' },
      {
        $group: {
          _id: '$nominees.nomineeId',
          nominationIds: { $push: '$_id' },
          nominatorsCount: { $addToSet: '$nominatorId' },
          statuses: { $addToSet: '$status' },
          categories: { $addToSet: '$nominees.categoryId' },
          submittedAt: { $max: '$createdAt' },
          websiteId: { $first: '$websiteId' },
        },
      },
      {
        $lookup: {
          from: 'registrees',
          localField: '_id',
          foreignField: '_id',
          as: 'nominee',
        },
      },
      { $unwind: '$nominee' },
    ];

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'nominee.name': searchRegex },
            { 'nominee.email': searchRegex },
            { 'nominee.organization': searchRegex },
            { 'nominee.city': searchRegex },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'websites',
              localField: 'websiteId',
              foreignField: '_id',
              as: 'website',
            },
          },
          { $unwind: { path: '$website', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'nomination_categories',
              localField: 'categories',
              foreignField: '_id',
              as: 'categoryDocs',
            },
          },
        ],
      },
    });

    const result = await this.nominationModel.aggregate(pipeline).exec();
    const data = result[0].data.map((doc) => ({
      ...doc,
      nominatorsCount: doc.nominatorsCount.length, // Convert unique IDs array to length
    }));
    const total = result[0].metadata[0]?.total || 0;

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

  /**
   * Find all nominations with pagination and filters
   */
  async findAll(query: QueryNominationDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const matchQuery: any = {};

    if (query.status) {
      matchQuery.status = query.status;
    }

    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }

    if (query.nominatorEmail) {
      // Need to find registree by email first, then filter nominations
      const registree = await this.registreeModel
        .findOne({ email: query.nominatorEmail.toLowerCase() })
        .exec();
      if (registree) {
        matchQuery.nominatorId = registree._id;
      } else {
        // No registree found — return empty result
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
    }

    if (query.search) {
      // Search by nominator name/email — look up registrees first
      const searchRegex = new RegExp(query.search, 'i');
      const matchingRegistrees = await this.registreeModel
        .find({
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { organization: searchRegex },
            { city: searchRegex },
          ],
        })
        .select('_id')
        .exec();

      const registreeIds = matchingRegistrees.map((r) => r._id);
      if (registreeIds.length > 0) {
        matchQuery.$or = [
          { nominatorId: { $in: registreeIds } },
          { 'nominees.nomineeId': { $in: registreeIds } },
        ];
      } else {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
    }

    const [data, total] = await Promise.all([
      this.nominationModel
        .find(matchQuery)
        .populate({
          path: 'nominatorId',
          select: 'name email phoneNumber organization city tags',
        })
        .populate({
          path: 'nominees.nomineeId',
          select: 'name email phoneNumber organization tags',
        })
        .populate({
          path: 'nominees.categoryId',
          select: 'name slug',
        })
        .populate('websiteId', 'name domain logo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.nominationModel.countDocuments(matchQuery).exec(),
    ]);

    const mappedData = data.map((doc) => {
      const obj: any = doc.toObject ? doc.toObject() : { ...doc };
      obj.submittedAt = doc.createdAt;
      return obj;
    });

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one nomination by ID
   */
  async findOne(id: string): Promise<Nomination> {
    const nomination = await this.nominationModel
      .findById(id)
      .populate({
        path: 'nominatorId',
        select: 'name email phoneNumber organization city tags countryCode',
      })
      .populate({
        path: 'nominees.nomineeId',
        select: 'name email phoneNumber organization tags countryCode',
      })
      .populate({
        path: 'nominees.categoryId',
        select: 'name slug',
      })
      .populate('websiteId', 'name domain logo')
      .exec();

    if (!nomination) {
      throw new NotFoundException(`Nomination with ID ${id} not found`);
    }

    return nomination;
  }

  /**
   * Update nomination (admin)
   */
  async update(
    id: string,
    updateDto: UpdateNominationDto,
  ): Promise<Nomination> {
    const updateData: any = {};
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }

    const nomination = await this.nominationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!nomination) {
      throw new NotFoundException(`Nomination with ID ${id} not found`);
    }

    return this.findOne(id);
  }

  /**
   * Update nomination status (admin)
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateNominationStatusDto,
  ): Promise<Nomination> {
    const existing = await this.findOne(id);
    const previousStatus = existing.status;

    const nomination = await this.nominationModel
      .findByIdAndUpdate(id, { status: updateStatusDto.status }, { new: true })
      .exec();

    if (!nomination) {
      throw new NotFoundException(`Nomination with ID ${id} not found`);
    }

    const result = await this.findOne(id);

    this.eventEmitter.emit(
      AppEvents.NOMINATION_STATUS_CHANGED,
      new NominationStatusChangedEvent(
        result._id.toString(),
        previousStatus,
        result.status,
      ),
    );

    return result;
  }

  /**
   * Soft delete a nomination
   */
  async remove(id: string): Promise<void> {
    const result = await this.nominationModel
      .findByIdAndUpdate(id, { isDeleted: new Date() })
      .exec();

    if (!result) {
      throw new NotFoundException(`Nomination with ID ${id} not found`);
    }
  }

  /**
   * Find or create a registree by email, adding the appropriate tag
   */
  private async findOrCreateRegistree(
    data: {
      name: string;
      email: string;
      phoneNumber?: string;
      organization?: string;
      city?: string;
    },
    tag: 'nominator' | 'nominee',
    websiteId?: string,
  ): Promise<Registree> {
    let registree = await this.registreeModel
      .findOne({ email: data.email.toLowerCase() })
      .exec();

    if (!registree) {
      registree = new this.registreeModel({
        name: data.name,
        email: data.email.toLowerCase(),
        phoneNumber: data.phoneNumber || '',
        organization: data.organization || '',
        city: data.city || '',
        tags: [tag],
        websiteId: websiteId
          ? (new Types.ObjectId(websiteId) as any)
          : undefined,
      });
    } else {
      // Update details
      registree.name = data.name;
      if (data.phoneNumber) registree.phoneNumber = data.phoneNumber;
      if (data.organization) registree.organization = data.organization;
      if (data.city) registree.city = data.city;
      if (websiteId) registree.websiteId = new Types.ObjectId(websiteId) as any;

      // Add tag if not already present
      if (!registree.tags) {
        registree.tags = [tag];
      } else if (!registree.tags.includes(tag)) {
        registree.tags.push(tag);
        registree.markModified('tags');
      }
    }

    return registree.save();
  }
}
