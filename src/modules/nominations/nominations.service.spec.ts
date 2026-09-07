import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { NominationsService } from './nominations.service';
import { Nomination } from './schemas/nomination.schema';
import { Registree } from '@modules/attendees/schemas/registree.schema';
import { WebsitesService } from '@modules/websites/websites.service';
import { CreateNominationDto } from './dto/nomination.dto';

describe('NominationsService', () => {
  let service: NominationsService;
  let mockNominationModel: any;
  let mockRegistreeModel: any;
  let mockWebsitesService: any;
  let mockEventEmitter: any;

  beforeEach(async () => {
    mockWebsitesService = {
      findOne: jest
        .fn()
        .mockResolvedValue({ _id: 'site-1', nominationActive: true }),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const mockSavedNomination = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      id: '507f1f77bcf86cd799439011',
      save: jest.fn().mockResolvedValue({ id: '507f1f77bcf86cd799439011' }),
    };

    mockNominationModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: mockSavedNomination._id,
      id: mockSavedNomination.id,
      save: jest.fn().mockResolvedValue({ id: mockSavedNomination.id }),
    }));

    mockNominationModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: mockSavedNomination._id,
        nominees: [
          { nomineeId: new Types.ObjectId(), categoryId: new Types.ObjectId() },
        ],
      }),
    });

    const mockSavedRegistree = {
      _id: new Types.ObjectId('507f1f77bcf86cd799439099'),
      name: 'John Doe',
      email: 'john@acme.com',
      save: jest.fn().mockResolvedValue(true),
      tags: [],
      markModified: jest.fn(),
    };

    mockRegistreeModel = jest.fn().mockImplementation((data) => ({
      ...data,
      _id: mockSavedRegistree._id,
      save: jest
        .fn()
        .mockResolvedValue({ ...data, _id: mockSavedRegistree._id }),
    }));

    mockRegistreeModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NominationsService,
        {
          provide: getModelToken(Nomination.name),
          useValue: mockNominationModel,
        },
        {
          provide: getModelToken(Registree.name),
          useValue: mockRegistreeModel,
        },
        {
          provide: WebsitesService,
          useValue: mockWebsitesService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<NominationsService>(NominationsService);
  });

  it('should throw BadRequestException if nominees array is empty', async () => {
    const dto: CreateNominationDto = {
      nominatorName: 'John Doe',
      nominatorCompany: 'Acme Corp',
      nominatorCity: 'Mumbai',
      nominatorEmail: 'john@acme.com',
      nominees: [],
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    await expect(service.create(dto)).rejects.toThrow(
      'At least one nominee is required.',
    );
  });

  it('should throw BadRequestException if more than 10 nominees are submitted in a single request', async () => {
    const nominees = Array.from({ length: 11 }, (_, i) => ({
      categoryId: new Types.ObjectId().toHexString(),
      contactName: `Nominee ${i + 1}`,
      companyName: `Company ${i + 1}`,
      contactEmail: `nominee${i + 1}@company.com`,
    }));

    const dto: CreateNominationDto = {
      nominatorName: 'John Doe',
      nominatorCompany: 'Acme Corp',
      nominatorCity: 'Mumbai',
      nominatorEmail: 'john@acme.com',
      nominees,
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    await expect(service.create(dto)).rejects.toThrow(
      'You can nominate a maximum of 10 nominees in a single request.',
    );
  });

  it('should allow nomination submission with up to 10 nominees in a single request', async () => {
    const nominees = Array.from({ length: 10 }, (_, i) => ({
      categoryId: new Types.ObjectId().toHexString(),
      contactName: `Nominee ${i + 1}`,
      companyName: `Company ${i + 1}`,
      contactEmail: `nominee${i + 1}@company.com`,
    }));

    const dto: CreateNominationDto = {
      nominatorName: 'John Doe',
      nominatorCompany: 'Acme Corp',
      nominatorCity: 'Mumbai',
      nominatorEmail: 'john@acme.com',
      nominees,
    };

    const result = await service.create(dto);
    expect(result).toBeDefined();
    expect(mockEventEmitter.emit).toHaveBeenCalled();
  });

  it('should allow nominator to submit unlimited nominations across multiple requests (no platform-wide cumulative limit)', async () => {
    // Submit first request with 8 nominees
    const firstBatch = Array.from({ length: 8 }, (_, i) => ({
      categoryId: new Types.ObjectId().toHexString(),
      contactName: `Nominee Batch1 ${i + 1}`,
      companyName: `Company ${i + 1}`,
      contactEmail: `nominee_b1_${i + 1}@company.com`,
    }));

    const firstDto: CreateNominationDto = {
      nominatorName: 'John Doe',
      nominatorCompany: 'Acme Corp',
      nominatorCity: 'Mumbai',
      nominatorEmail: 'john@acme.com',
      nominees: firstBatch,
    };

    const firstResult = await service.create(firstDto);
    expect(firstResult).toBeDefined();

    // Submit second request with 5 nominees (total across requests is 13, which was previously blocked)
    const secondBatch = Array.from({ length: 5 }, (_, i) => ({
      categoryId: new Types.ObjectId().toHexString(),
      contactName: `Nominee Batch2 ${i + 1}`,
      companyName: `Company ${i + 1}`,
      contactEmail: `nominee_b2_${i + 1}@company.com`,
    }));

    const secondDto: CreateNominationDto = {
      nominatorName: 'John Doe',
      nominatorCompany: 'Acme Corp',
      nominatorCity: 'Mumbai',
      nominatorEmail: 'john@acme.com',
      nominees: secondBatch,
    };

    const secondResult = await service.create(secondDto);
    expect(secondResult).toBeDefined();
  });
});
