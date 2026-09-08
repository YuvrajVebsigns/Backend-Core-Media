import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { NominationExportService } from './nomination-export.service';
import { Nomination, NominationStatus } from './schemas/nomination.schema';
import { Registree } from '@modules/attendees/schemas/registree.schema';
import { NominationCategory } from './schemas/nomination-category.schema';
import { NominationSubCategory } from './schemas/nomination-sub-category.schema';

describe('NominationExportService', () => {
  let service: NominationExportService;
  let mockNominationModel: any;
  let mockRegistreeModel: any;
  let mockCategoryModel: any;
  let mockSubCategoryModel: any;

  beforeEach(async () => {
    mockNominationModel = {
      aggregate: jest.fn(),
    };
    mockRegistreeModel = {};
    mockCategoryModel = {};
    mockSubCategoryModel = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NominationExportService,
        {
          provide: getModelToken(Nomination.name),
          useValue: mockNominationModel,
        },
        {
          provide: getModelToken(Registree.name),
          useValue: mockRegistreeModel,
        },
        {
          provide: getModelToken(NominationCategory.name),
          useValue: mockCategoryModel,
        },
        {
          provide: getModelToken(NominationSubCategory.name),
          useValue: mockSubCategoryModel,
        },
      ],
    }).compile();

    service = module.get<NominationExportService>(NominationExportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportNominees', () => {
    it('should generate a valid 3-sheet Excel workbook with live formulas for nominees', async () => {
      const mockNomineeId = new Types.ObjectId();
      const mockNomineeAggData = [
        {
          _id: mockNomineeId,
          totalVotes: 6,
          uniqueNominators: [new Types.ObjectId(), new Types.ObjectId()],
          approvedVotes: 4,
          pendingVotes: 2,
          rejectedVotes: 0,
          reviewedVotes: 0,
          nominee: {
            name: 'Dr. John Doe',
            email: 'john@acme.com',
            organization: 'Acme Corp',
            city: 'Mumbai',
            phoneNumber: '9876543210',
          },
          website: { name: 'CIO Summit 2026' },
          categoryDocs: [{ name: 'Best CIO' }],
          lastNominatedAt: new Date(),
        },
      ];

      const mockSubmissionsAggData = [
        {
          _id: new Types.ObjectId(),
          createdAt: new Date(),
          status: NominationStatus.APPROVED,
          nominee: {
            name: 'Dr. John Doe',
            email: 'john@acme.com',
            organization: 'Acme Corp',
          },
          nominator: {
            name: 'Alice Smith',
            email: 'alice@partner.com',
            organization: 'Partner Co',
          },
          nominatorSnapshot: {
            name: 'Alice Smith',
            email: 'alice@partner.com',
          },
          category: { name: 'Best CIO' },
          subCategory: { name: 'Enterprise' },
          website: { name: 'CIO Summit 2026' },
        },
      ];

      mockNominationModel.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockNomineeAggData),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockSubmissionsAggData),
        });

      const buffer = await service.exportNominees({});
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);

      // Verify Excel contents using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);
      expect(workbook.getWorksheet('Analytics Overview')).toBeDefined();
      expect(workbook.getWorksheet('Nominee Directory')).toBeDefined();
      expect(workbook.getWorksheet('Submissions Audit Log')).toBeDefined();

      const dirSheet = workbook.getWorksheet('Nominee Directory')!;
      expect(dirSheet.rowCount).toBeGreaterThanOrEqual(2);

      // Verify formula in row 2
      const row2 = dirSheet.getRow(2);
      const approvalRateCell = row2.getCell(13);
      expect((approvalRateCell.value as any).formula).toBe(
        'IF(H2>0, J2/H2, 0)',
      );
    });
  });

  describe('exportNominators', () => {
    it('should generate a valid 3-sheet Excel workbook with live formulas for nominators', async () => {
      const mockNominatorId = new Types.ObjectId();
      const mockNominatorAggData = [
        {
          _id: mockNominatorId,
          totalSubmissions: 3,
          totalNomineesCount: 7,
          approvedCount: 2,
          pendingCount: 1,
          rejectedCount: 0,
          reviewedCount: 0,
          nominator: {
            name: 'Sarah Connor',
            email: 'sarah@sky.net',
            organization: 'Resistance Inc',
            city: 'Delhi',
            phoneNumber: '9123456789',
          },
          website: { name: 'CIO Awards' },
          lastSubmittedAt: new Date(),
        },
      ];

      const mockSubmissionsAggData = [
        {
          _id: new Types.ObjectId(),
          createdAt: new Date(),
          status: NominationStatus.APPROVED,
          nominee: { name: 'John Connor', email: 'john@sky.net' },
          nominator: { name: 'Sarah Connor', email: 'sarah@sky.net' },
          nominatorSnapshot: { name: 'Sarah Connor', email: 'sarah@sky.net' },
          category: { name: 'Leader of the Year' },
          website: { name: 'CIO Awards' },
        },
      ];

      mockNominationModel.aggregate
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockNominatorAggData),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(mockSubmissionsAggData),
        });

      const buffer = await service.exportNominators({});
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);

      expect(workbook.worksheets.length).toBe(3);
      expect(workbook.getWorksheet('Analytics Overview')).toBeDefined();
      expect(workbook.getWorksheet('Nominator Directory')).toBeDefined();
      expect(workbook.getWorksheet('Submissions Audit Log')).toBeDefined();

      const dirSheet = workbook.getWorksheet('Nominator Directory')!;
      expect(dirSheet.rowCount).toBeGreaterThanOrEqual(2);

      const row2 = dirSheet.getRow(2);
      const rateCell = row2.getCell(12);
      expect((rateCell.value as any).formula).toBe('IF(H2>0, I2/H2, 0)');
    });
  });
});
