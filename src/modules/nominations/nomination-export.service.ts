import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Nomination, NominationStatus } from './schemas/nomination.schema';
import { Registree } from '@modules/attendees/schemas/registree.schema';
import { NominationCategory } from './schemas/nomination-category.schema';
import { NominationSubCategory } from './schemas/nomination-sub-category.schema';
import { QueryNominationExportDto } from './dto/nomination.dto';

interface DateFilter {
  $gte?: Date;
  $lte?: Date;
}

@Injectable()
export class NominationExportService {
  constructor(
    @InjectModel(Nomination.name)
    private readonly nominationModel: Model<Nomination>,
    @InjectModel(Registree.name)
    private readonly registreeModel: Model<Registree>,
    @InjectModel(NominationCategory.name)
    private readonly categoryModel: Model<NominationCategory>,
    @InjectModel(NominationSubCategory.name)
    private readonly subCategoryModel: Model<NominationSubCategory>,
  ) {}

  /**
   * Export Nominees with voting analytics and formulas
   */
  async exportNominees(query: QueryNominationExportDto): Promise<Buffer> {
    const matchQuery: any = { isDeleted: null };

    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }
    if (query.status) {
      matchQuery.status = query.status;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: DateFilter = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (query.endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        dateFilter.$lte = end;
      }
      matchQuery.createdAt = dateFilter;
    }

    if (query.categoryId) {
      matchQuery['nominees.categoryId'] = new Types.ObjectId(query.categoryId);
    }
    if (query.subCategoryId) {
      matchQuery['nominees.subCategoryId'] = new Types.ObjectId(
        query.subCategoryId,
      );
    }

    // 1. Grouped Nominees aggregation
    const pipeline: any[] = [{ $match: matchQuery }, { $unwind: '$nominees' }];

    if (query.categoryId) {
      pipeline.push({
        $match: { 'nominees.categoryId': new Types.ObjectId(query.categoryId) },
      });
    }
    if (query.subCategoryId) {
      pipeline.push({
        $match: {
          'nominees.subCategoryId': new Types.ObjectId(query.subCategoryId),
        },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$nominees.nomineeId',
          totalVotes: { $sum: 1 },
          uniqueNominators: { $addToSet: '$nominatorId' },
          approvedVotes: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.APPROVED] }, 1, 0],
            },
          },
          pendingVotes: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.PENDING] }, 1, 0],
            },
          },
          rejectedVotes: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.REJECTED] }, 1, 0],
            },
          },
          reviewedVotes: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.REVIEWED] }, 1, 0],
            },
          },
          categoryIds: { $addToSet: '$nominees.categoryId' },
          subCategoryIds: { $addToSet: '$nominees.subCategoryId' },
          websiteId: { $first: '$websiteId' },
          lastNominatedAt: { $max: '$createdAt' },
          firstNominatedAt: { $min: '$createdAt' },
          snapshotNames: { $addToSet: '$nominees.contactName' },
          snapshotCompanies: { $addToSet: '$nominees.companyName' },
          snapshotEmails: { $addToSet: '$nominees.contactEmail' },
          snapshotPhones: { $addToSet: '$nominees.mobileNo' },
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
      { $unwind: { path: '$nominee', preserveNullAndEmptyArrays: true } },
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
          localField: 'categoryIds',
          foreignField: '_id',
          as: 'categoryDocs',
        },
      },
      {
        $lookup: {
          from: 'nomination_sub_categories',
          localField: 'subCategoryIds',
          foreignField: '_id',
          as: 'subCategoryDocs',
        },
      },
      { $sort: { totalVotes: -1, lastNominatedAt: -1 } },
    );

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'nominee.name': searchRegex },
            { 'nominee.email': searchRegex },
            { 'nominee.organization': searchRegex },
            { 'nominee.city': searchRegex },
            { snapshotNames: searchRegex },
            { snapshotCompanies: searchRegex },
            { snapshotEmails: searchRegex },
          ],
        },
      });
    }

    const nomineeRows = await this.nominationModel.aggregate(pipeline).exec();

    // 2. Fetch Detailed Submissions Log
    const rawSubmissionsPipeline: any[] = [
      { $match: matchQuery },
      { $unwind: '$nominees' },
      {
        $lookup: {
          from: 'registrees',
          localField: 'nominatorId',
          foreignField: '_id',
          as: 'nominator',
        },
      },
      { $unwind: { path: '$nominator', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'registrees',
          localField: 'nominees.nomineeId',
          foreignField: '_id',
          as: 'nominee',
        },
      },
      { $unwind: { path: '$nominee', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'nomination_categories',
          localField: 'nominees.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'nomination_sub_categories',
          localField: 'nominees.subCategoryId',
          foreignField: '_id',
          as: 'subCategory',
        },
      },
      { $unwind: { path: '$subCategory', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'websites',
          localField: 'websiteId',
          foreignField: '_id',
          as: 'website',
        },
      },
      { $unwind: { path: '$website', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 10000 },
    ];

    const submissionRows = await this.nominationModel
      .aggregate(rawSubmissionsPipeline)
      .exec();

    return this.buildNomineesExcelWorkbook(nomineeRows, submissionRows, query);
  }

  /**
   * Export Nominators with voting & submission analytics and formulas
   */
  async exportNominators(query: QueryNominationExportDto): Promise<Buffer> {
    const matchQuery: any = { isDeleted: null };

    if (query.websiteId) {
      matchQuery.websiteId = new Types.ObjectId(query.websiteId);
    }
    if (query.status) {
      matchQuery.status = query.status;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: DateFilter = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (query.endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        dateFilter.$lte = end;
      }
      matchQuery.createdAt = dateFilter;
    }

    if (query.categoryId) {
      matchQuery['nominees.categoryId'] = new Types.ObjectId(query.categoryId);
    }
    if (query.subCategoryId) {
      matchQuery['nominees.subCategoryId'] = new Types.ObjectId(
        query.subCategoryId,
      );
    }

    // 1. Grouped Nominators aggregation
    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$nominatorId',
          nominationIds: { $push: '$_id' },
          totalSubmissions: { $sum: 1 },
          totalNomineesCount: { $sum: { $size: '$nominees' } },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.APPROVED] }, 1, 0],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.PENDING] }, 1, 0],
            },
          },
          rejectedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.REJECTED] }, 1, 0],
            },
          },
          reviewedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', NominationStatus.REVIEWED] }, 1, 0],
            },
          },
          lastSubmittedAt: { $max: '$createdAt' },
          firstSubmittedAt: { $min: '$createdAt' },
          websiteId: { $first: '$websiteId' },
          nominatorSnapshot: { $last: '$nominatorSnapshot' },
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
      { $unwind: { path: '$nominator', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'websites',
          localField: 'websiteId',
          foreignField: '_id',
          as: 'website',
        },
      },
      { $unwind: { path: '$website', preserveNullAndEmptyArrays: true } },
      { $sort: { totalNomineesCount: -1, lastSubmittedAt: -1 } },
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
            { 'nominatorSnapshot.name': searchRegex },
            { 'nominatorSnapshot.email': searchRegex },
            { 'nominatorSnapshot.company': searchRegex },
          ],
        },
      });
    }

    const nominatorRows = await this.nominationModel.aggregate(pipeline).exec();

    // 2. Fetch Detailed Submissions Log
    const rawSubmissionsPipeline: any[] = [
      { $match: matchQuery },
      { $unwind: '$nominees' },
      {
        $lookup: {
          from: 'registrees',
          localField: 'nominatorId',
          foreignField: '_id',
          as: 'nominator',
        },
      },
      { $unwind: { path: '$nominator', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'registrees',
          localField: 'nominees.nomineeId',
          foreignField: '_id',
          as: 'nominee',
        },
      },
      { $unwind: { path: '$nominee', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'nomination_categories',
          localField: 'nominees.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'nomination_sub_categories',
          localField: 'nominees.subCategoryId',
          foreignField: '_id',
          as: 'subCategory',
        },
      },
      { $unwind: { path: '$subCategory', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'websites',
          localField: 'websiteId',
          foreignField: '_id',
          as: 'website',
        },
      },
      { $unwind: { path: '$website', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $limit: 10000 },
    ];

    const submissionRows = await this.nominationModel
      .aggregate(rawSubmissionsPipeline)
      .exec();

    return this.buildNominatorsExcelWorkbook(
      nominatorRows,
      submissionRows,
      query,
    );
  }

  // ==========================================
  // EXCEL WORKBOOK BUILDERS & STYLING
  // ==========================================

  private async buildNomineesExcelWorkbook(
    nomineeRows: any[],
    submissionRows: any[],
    query: QueryNominationExportDto,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Core Media System';
    workbook.created = new Date();

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // ----------------------------------------------------
    // Sheet 1: Analytics Overview (KPI Dashboard)
    // ----------------------------------------------------
    const overviewSheet = workbook.addWorksheet('Analytics Overview', {
      views: [{ showGridLines: true }],
    });

    overviewSheet.columns = [
      { width: 4 },
      { width: 28 },
      { width: 22 },
      { width: 34 },
      { width: 4 },
    ];

    // Banner Header
    overviewSheet.mergeCells('B2:D2');
    const titleCell = overviewSheet.getCell('B2');
    titleCell.value = 'NOMINEE & VOTING PERFORMANCE ANALYTICS';
    titleCell.font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    overviewSheet.getRow(2).height = 34;

    // Subtitle / Filters info
    overviewSheet.mergeCells('B3:D3');
    const subtitleCell = overviewSheet.getCell('B3');
    subtitleCell.value = `Report Generated: ${dateStr} | Status: ${query.status || 'All'} | Range: ${
      query.startDate || 'All Time'
    } to ${query.endDate || 'Present'}`;
    subtitleCell.font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF64748B' },
    };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    overviewSheet.getRow(3).height = 20;

    // KPI Metrics Table Header
    overviewSheet.getRow(5).values = [
      '',
      'Key Performance Indicator',
      'Value',
      'Analytics Formula / Source',
    ];
    const kpiHeader = overviewSheet.getRow(5);
    kpiHeader.height = 24;
    kpiHeader.eachCell((cell, colNum) => {
      if (colNum >= 2 && colNum <= 4) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF334155' }, // Slate 700
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = this.getThinBorders();
      }
    });

    const totalNominees = nomineeRows.length;
    const totalVotes = nomineeRows.reduce(
      (acc, r) => acc + (r.totalVotes || 0),
      0,
    );
    const totalApproved = nomineeRows.reduce(
      (acc, r) => acc + (r.approvedVotes || 0),
      0,
    );
    const totalPending = nomineeRows.reduce(
      (acc, r) => acc + (r.pendingVotes || 0),
      0,
    );
    const totalRejected = nomineeRows.reduce(
      (acc, r) => acc + (r.rejectedVotes || 0),
      0,
    );

    const kpiItems = [
      {
        kpi: 'Total Nominees Evaluated',
        formula:
          "='Nominee Directory'!H" +
          (totalNominees > 0 ? totalNominees + 3 : 3), // References summary or directory
        directFormula:
          totalNominees > 0
            ? `=COUNTA('Nominee Directory'!B3:B${totalNominees + 2})`
            : '0',
        result: totalNominees,
        desc: 'Count of unique individuals receiving nominations',
        numFmt: '#,##0',
      },
      {
        kpi: 'Total Nominations / Votes Received',
        directFormula:
          totalNominees > 0
            ? `=SUM('Nominee Directory'!H3:H${totalNominees + 2})`
            : '0',
        result: totalVotes,
        desc: 'Cumulative sum of all nomination votes recorded',
        numFmt: '#,##0',
      },
      {
        kpi: 'Total Approved Votes',
        directFormula:
          totalNominees > 0
            ? `=SUM('Nominee Directory'!J3:J${totalNominees + 2})`
            : '0',
        result: totalApproved,
        desc: 'Votes reviewed and approved by administrators',
        numFmt: '#,##0',
      },
      {
        kpi: 'Total Pending Verification',
        directFormula:
          totalNominees > 0
            ? `=SUM('Nominee Directory'!K3:K${totalNominees + 2})`
            : '0',
        result: totalPending,
        desc: 'Awaiting admin verification or review',
        numFmt: '#,##0',
      },
      {
        kpi: 'Total Rejected Nominations',
        directFormula:
          totalNominees > 0
            ? `=SUM('Nominee Directory'!L3:L${totalNominees + 2})`
            : '0',
        result: totalRejected,
        desc: 'Submissions disqualified or marked rejected',
        numFmt: '#,##0',
      },
      {
        kpi: 'Overall Approval Rate',
        directFormula: '=IF(C7>0, C8/C7, 0)', // Approved / Total Votes
        result: totalVotes > 0 ? totalApproved / totalVotes : 0,
        desc: 'Formula: =IF(Total Votes > 0, Approved / Total, 0)',
        numFmt: '0.0%',
      },
      {
        kpi: 'Average Votes Per Nominee',
        directFormula: '=IF(C6>0, C7/C6, 0)', // Total Votes / Total Nominees
        result: totalNominees > 0 ? totalVotes / totalNominees : 0,
        desc: 'Formula: =IF(Nominees > 0, Votes / Nominees, 0)',
        numFmt: '0.0',
      },
    ];

    kpiItems.forEach((item, idx) => {
      const rowNum = 6 + idx;
      const row = overviewSheet.getRow(rowNum);
      row.height = 22;

      const kpiCell = row.getCell(2);
      kpiCell.value = item.kpi;
      kpiCell.font = { bold: true, color: { argb: 'FF1E293B' }, size: 10 };
      kpiCell.border = this.getThinBorders();

      const valCell = row.getCell(3);
      valCell.value = {
        formula: item.directFormula.replace(/^=/, ''),
        result: item.result,
      };
      valCell.numFmt = item.numFmt;
      valCell.font = { bold: true, color: { argb: 'FF0F766E' }, size: 11 }; // Teal bold
      valCell.alignment = { horizontal: 'right', vertical: 'middle' };
      valCell.border = this.getThinBorders();

      const descCell = row.getCell(4);
      descCell.value = item.desc;
      descCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9 };
      descCell.border = this.getThinBorders();

      if (idx % 2 === 1) {
        kpiCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
        valCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
        descCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });

    // ----------------------------------------------------
    // Sheet 2: Nominee Directory (Main Aggregated Table)
    // ----------------------------------------------------
    const dirSheet = workbook.addWorksheet('Nominee Directory', {
      views: [{ state: 'frozen', ySplit: 2, showGridLines: true }],
    });

    dirSheet.columns = [
      { header: 'S.No', key: 'sno', width: 7 },
      { header: 'Nominee Name', key: 'name', width: 25 },
      { header: 'Email Address', key: 'email', width: 28 },
      { header: 'Organization / Company', key: 'company', width: 26 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'Mobile No', key: 'phone', width: 16 },
      { header: 'Categories', key: 'categories', width: 28 },
      { header: 'Total Votes Received', key: 'votes', width: 20 },
      { header: 'Unique Nominators', key: 'uniqueNominators', width: 18 },
      { header: 'Approved Votes', key: 'approved', width: 16 },
      { header: 'Pending Votes', key: 'pending', width: 16 },
      { header: 'Rejected Votes', key: 'rejected', width: 16 },
      { header: 'Approval Rate (Formula)', key: 'approvalRate', width: 22 },
      { header: 'Performance Tier (Formula)', key: 'tier', width: 24 },
      { header: 'Website Source', key: 'website', width: 22 },
      { header: 'Latest Nomination Date', key: 'latestDate', width: 22 },
    ];

    // Style Header Row
    const dirHeader = dirSheet.getRow(1);
    dirHeader.height = 30;
    dirHeader.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate 800
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = this.getThinBorders();
    });

    // Fill Data Rows
    nomineeRows.forEach((row, index) => {
      const rowNum = index + 2; // Data starts on row 2
      const reg = row.nominee || {};
      const name = reg.name || row.snapshotNames?.[0] || 'Unknown';
      const email = reg.email || row.snapshotEmails?.[0] || '—';
      const company = reg.organization || row.snapshotCompanies?.[0] || '—';
      const city = reg.city || '—';
      const phone = reg.phoneNumber || row.snapshotPhones?.[0] || '—';
      const catNames =
        (row.categoryDocs || []).map((c: any) => c.name).join(', ') || '—';
      const websiteName = row.website?.name || 'Main Website';
      const latestDate = row.lastNominatedAt
        ? new Date(row.lastNominatedAt).toISOString().slice(0, 10)
        : '—';

      const votesCount = row.totalVotes || 0;
      const uniqueNominatorCount = row.uniqueNominators?.length || 0;
      const approvedCount = row.approvedVotes || 0;
      const pendingCount = row.pendingVotes || 0;
      const rejectedCount = row.rejectedVotes || 0;

      const excelRow = dirSheet.addRow({
        sno: index + 1,
        name,
        email,
        company,
        city,
        phone,
        categories: catNames,
        votes: votesCount,
        uniqueNominators: uniqueNominatorCount,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        approvalRate: {
          formula: `IF(H${rowNum}>0, J${rowNum}/H${rowNum}, 0)`,
          result: votesCount > 0 ? approvedCount / votesCount : 0,
        },
        tier: {
          formula: `IF(H${rowNum}>=5, "Top Contender", IF(H${rowNum}>=2, "Active", "Nominated"))`,
          result:
            votesCount >= 5
              ? 'Top Contender'
              : votesCount >= 2
                ? 'Active'
                : 'Nominated',
        },
        website: websiteName,
        latestDate,
      });

      excelRow.height = 20;
      excelRow.eachCell((cell, colNum) => {
        cell.border = this.getThinBorders();
        cell.font = { name: 'Calibri', size: 10 };
        if (colNum === 1 || colNum === 15 || colNum === 16) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum >= 8 && colNum <= 12) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (colNum === 13) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else if (colNum === 14) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { bold: true, size: 9 };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });
    });

    // Summary Row at bottom of Nominee Directory
    if (nomineeRows.length > 0) {
      const summaryRowNum = nomineeRows.length + 2;
      const lastDataRow = summaryRowNum - 1;
      const summaryRow = dirSheet.addRow({
        sno: '',
        name: 'TOTAL / AVERAGE',
        email: '',
        company: '',
        city: '',
        phone: '',
        categories: '',
        votes: { formula: `SUM(H2:H${lastDataRow})`, result: totalVotes },
        uniqueNominators: {
          formula: `SUM(I2:I${lastDataRow})`,
          result: nomineeRows.reduce(
            (a, r) => a + (r.uniqueNominators?.length || 0),
            0,
          ),
        },
        approved: { formula: `SUM(J2:J${lastDataRow})`, result: totalApproved },
        pending: { formula: `SUM(K2:K${lastDataRow})`, result: totalPending },
        rejected: { formula: `SUM(L2:L${lastDataRow})`, result: totalRejected },
        approvalRate: {
          formula: `AVERAGE(M2:M${lastDataRow})`,
          result: totalVotes > 0 ? totalApproved / totalVotes : 0,
        },
        tier: '',
        website: '',
        latestDate: '',
      });

      summaryRow.height = 24;
      summaryRow.eachCell((cell, colNum) => {
        cell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }, // Slate 200
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'double', color: { argb: 'FF475569' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (colNum >= 8 && colNum <= 12) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (colNum === 13) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        }
      });
    }

    // ----------------------------------------------------
    // Sheet 3: Detailed Submissions Log (Audit / Point-in-time)
    // ----------------------------------------------------
    const logSheet = workbook.addWorksheet('Submissions Audit Log', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    logSheet.columns = [
      { header: 'S.No', key: 'sno', width: 7 },
      { header: 'Submission ID', key: 'subId', width: 24 },
      { header: 'Submission Date', key: 'date', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Nominee Name', key: 'nomineeName', width: 24 },
      { header: 'Nominee Email', key: 'nomineeEmail', width: 26 },
      { header: 'Nominee Company', key: 'nomineeCompany', width: 24 },
      { header: 'Nominee Mobile', key: 'nomineePhone', width: 16 },
      { header: 'Category', key: 'category', width: 24 },
      { header: 'Subcategory', key: 'subcategory', width: 24 },
      { header: 'Nominator Name', key: 'nominatorName', width: 24 },
      { header: 'Nominator Email', key: 'nominatorEmail', width: 26 },
      { header: 'Nominator Company', key: 'nominatorCompany', width: 24 },
      { header: 'Nominator City', key: 'nominatorCity', width: 16 },
      { header: 'Nominator Phone', key: 'nominatorPhone', width: 16 },
      { header: 'Website', key: 'website', width: 20 },
    ];

    const logHeader = logSheet.getRow(1);
    logHeader.height = 28;
    logHeader.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF334155' }, // Slate 700
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = this.getThinBorders();
    });

    submissionRows.forEach((sub, index) => {
      const nomSnap = sub.nominatorSnapshot || {};
      const nomReg = sub.nominator || {};
      const neeSnap = sub.nominees || {};
      const neeReg = sub.nominee || {};

      const excelRow = logSheet.addRow({
        sno: index + 1,
        subId: sub._id.toString(),
        date: sub.createdAt
          ? new Date(sub.createdAt).toISOString().slice(0, 19).replace('T', ' ')
          : '—',
        status: sub.status || 'PENDING',
        nomineeName: neeReg.name || neeSnap.contactName || '—',
        nomineeEmail: neeReg.email || neeSnap.contactEmail || '—',
        nomineeCompany: neeReg.organization || neeSnap.companyName || '—',
        nomineePhone: neeReg.phoneNumber || neeSnap.mobileNo || '—',
        category: sub.category?.name || '—',
        subcategory: sub.subCategory?.name || '—',
        nominatorName: nomSnap.name || nomReg.name || '—',
        nominatorEmail: nomSnap.email || nomReg.email || '—',
        nominatorCompany: nomSnap.company || nomReg.organization || '—',
        nominatorCity: nomSnap.city || nomReg.city || '—',
        nominatorPhone: nomSnap.phone || nomReg.phoneNumber || '—',
        website: sub.website?.name || 'Main Website',
      });

      excelRow.height = 19;
      excelRow.eachCell((cell, colNum) => {
        cell.border = this.getThinBorders();
        cell.font = { name: 'Calibri', size: 9 };
        if (colNum === 1 || colNum === 3 || colNum === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  private async buildNominatorsExcelWorkbook(
    nominatorRows: any[],
    submissionRows: any[],
    query: QueryNominationExportDto,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Core Media System';
    workbook.created = new Date();

    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // ----------------------------------------------------
    // Sheet 1: Analytics Overview (KPI Dashboard)
    // ----------------------------------------------------
    const overviewSheet = workbook.addWorksheet('Analytics Overview', {
      views: [{ showGridLines: true }],
    });

    overviewSheet.columns = [
      { width: 4 },
      { width: 30 },
      { width: 22 },
      { width: 34 },
      { width: 4 },
    ];

    // Banner Header
    overviewSheet.mergeCells('B2:D2');
    const titleCell = overviewSheet.getCell('B2');
    titleCell.value = 'NOMINATOR PARTICIPATION & ACTIVITY ANALYTICS';
    titleCell.font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    overviewSheet.getRow(2).height = 34;

    // Subtitle
    overviewSheet.mergeCells('B3:D3');
    const subtitleCell = overviewSheet.getCell('B3');
    subtitleCell.value = `Report Generated: ${dateStr} | Status: ${query.status || 'All'} | Range: ${
      query.startDate || 'All Time'
    } to ${query.endDate || 'Present'}`;
    subtitleCell.font = {
      name: 'Calibri',
      size: 10,
      italic: true,
      color: { argb: 'FF64748B' },
    };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    overviewSheet.getRow(3).height = 20;

    // KPI Metrics Table Header
    overviewSheet.getRow(5).values = [
      '',
      'Key Activity Metric',
      'Value',
      'Formula / Description',
    ];
    const kpiHeader = overviewSheet.getRow(5);
    kpiHeader.height = 24;
    kpiHeader.eachCell((cell, colNum) => {
      if (colNum >= 2 && colNum <= 4) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF334155' },
        };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = this.getThinBorders();
      }
    });

    const totalNominators = nominatorRows.length;
    const totalNomineesProposed = nominatorRows.reduce(
      (a, r) => a + (r.totalNomineesCount || 0),
      0,
    );
    const totalSubmissions = nominatorRows.reduce(
      (a, r) => a + (r.totalSubmissions || 0),
      0,
    );
    const totalApprovedNominations = nominatorRows.reduce(
      (a, r) => a + (r.approvedCount || 0),
      0,
    );
    const totalPendingNominations = nominatorRows.reduce(
      (a, r) => a + (r.pendingCount || 0),
      0,
    );

    const kpiItems = [
      {
        kpi: 'Total Active Nominators',
        directFormula:
          totalNominators > 0
            ? `=COUNTA('Nominator Directory'!B2:B${totalNominators + 1})`
            : '0',
        result: totalNominators,
        desc: 'Unique nominators submitting nominations',
        numFmt: '#,##0',
      },
      {
        kpi: 'Total Nominees Proposed',
        directFormula:
          totalNominators > 0
            ? `=SUM('Nominator Directory'!G2:G${totalNominators + 1})`
            : '0',
        result: totalNomineesProposed,
        desc: 'Total candidate nominees proposed across submissions',
        numFmt: '#,##0',
      },
      {
        kpi: 'Total Submissions Batches',
        directFormula:
          totalNominators > 0
            ? `=SUM('Nominator Directory'!H2:H${totalNominators + 1})`
            : '0',
        result: totalSubmissions,
        desc: 'Form submission requests logged in system',
        numFmt: '#,##0',
      },
      {
        kpi: 'Average Nominees Per Nominator',
        directFormula: '=IF(C6>0, C7/C6, 0)', // Nominees / Nominators
        result:
          totalNominators > 0 ? totalNomineesProposed / totalNominators : 0,
        desc: 'Formula: =IF(Nominators > 0, Proposed / Nominators, 0)',
        numFmt: '0.0',
      },
      {
        kpi: 'Total Approved Submissions',
        directFormula:
          totalNominators > 0
            ? `=SUM('Nominator Directory'!I2:I${totalNominators + 1})`
            : '0',
        result: totalApprovedNominations,
        desc: 'Submissions successfully verified & approved',
        numFmt: '#,##0',
      },
      {
        kpi: 'Total Pending Verification',
        directFormula:
          totalNominators > 0
            ? `=SUM('Nominator Directory'!J2:J${totalNominators + 1})`
            : '0',
        result: totalPendingNominations,
        desc: 'Submissions under review',
        numFmt: '#,##0',
      },
      {
        kpi: 'Nominator Success / Approval Rate',
        directFormula: '=IF(C8>0, C10/C8, 0)', // Approved Submissions / Total Submissions
        result:
          totalSubmissions > 0
            ? totalApprovedNominations / totalSubmissions
            : 0,
        desc: 'Formula: =IF(Submissions > 0, Approved / Submissions, 0)',
        numFmt: '0.0%',
      },
    ];

    kpiItems.forEach((item, idx) => {
      const rowNum = 6 + idx;
      const row = overviewSheet.getRow(rowNum);
      row.height = 22;

      const kpiCell = row.getCell(2);
      kpiCell.value = item.kpi;
      kpiCell.font = { bold: true, color: { argb: 'FF1E293B' }, size: 10 };
      kpiCell.border = this.getThinBorders();

      const valCell = row.getCell(3);
      valCell.value = {
        formula: item.directFormula.replace(/^=/, ''),
        result: item.result,
      };
      valCell.numFmt = item.numFmt;
      valCell.font = { bold: true, color: { argb: 'FF4338CA' }, size: 11 }; // Indigo bold
      valCell.alignment = { horizontal: 'right', vertical: 'middle' };
      valCell.border = this.getThinBorders();

      const descCell = row.getCell(4);
      descCell.value = item.desc;
      descCell.font = { italic: true, color: { argb: 'FF64748B' }, size: 9 };
      descCell.border = this.getThinBorders();

      if (idx % 2 === 1) {
        kpiCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
        valCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
        descCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });

    // ----------------------------------------------------
    // Sheet 2: Nominator Directory (Main Table)
    // ----------------------------------------------------
    const dirSheet = workbook.addWorksheet('Nominator Directory', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    dirSheet.columns = [
      { header: 'S.No', key: 'sno', width: 7 },
      { header: 'Nominator Name', key: 'name', width: 25 },
      { header: 'Email Address', key: 'email', width: 28 },
      { header: 'Organization / Company', key: 'company', width: 26 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'Phone Number', key: 'phone', width: 16 },
      { header: 'Nominees Proposed', key: 'nomineesCount', width: 20 },
      { header: 'Submissions Count', key: 'submissions', width: 18 },
      { header: 'Approved Submissions', key: 'approved', width: 18 },
      { header: 'Pending Submissions', key: 'pending', width: 18 },
      { header: 'Rejected Submissions', key: 'rejected', width: 18 },
      { header: 'Approval Ratio (Formula)', key: 'approvalRate', width: 22 },
      { header: 'Engagement Level (Formula)', key: 'engagement', width: 24 },
      { header: 'Website Source', key: 'website', width: 22 },
      { header: 'Latest Submission Date', key: 'latestDate', width: 22 },
    ];

    const dirHeader = dirSheet.getRow(1);
    dirHeader.height = 30;
    dirHeader.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = this.getThinBorders();
    });

    nominatorRows.forEach((row, index) => {
      const rowNum = index + 2;
      const reg = row.nominator || {};
      const snap = row.nominatorSnapshot || {};

      const name = snap.name || reg.name || 'Unknown';
      const email = snap.email || reg.email || '—';
      const company = snap.company || reg.organization || '—';
      const city = snap.city || reg.city || '—';
      const phone = snap.phone || reg.phoneNumber || '—';
      const websiteName = row.website?.name || 'Main Website';
      const latestDate = row.lastSubmittedAt
        ? new Date(row.lastSubmittedAt).toISOString().slice(0, 10)
        : '—';

      const nomineesCount = row.totalNomineesCount || 0;
      const submissionsCount = row.totalSubmissions || 0;
      const approvedCount = row.approvedCount || 0;
      const pendingCount = row.pendingCount || 0;
      const rejectedCount = row.rejectedCount || 0;

      const excelRow = dirSheet.addRow({
        sno: index + 1,
        name,
        email,
        company,
        city,
        phone,
        nomineesCount,
        submissions: submissionsCount,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        approvalRate: {
          formula: `IF(H${rowNum}>0, I${rowNum}/H${rowNum}, 0)`,
          result: submissionsCount > 0 ? approvedCount / submissionsCount : 0,
        },
        engagement: {
          formula: `IF(G${rowNum}>=5, "Key Influencer", IF(G${rowNum}>=2, "Active Nominator", "Participant"))`,
          result:
            nomineesCount >= 5
              ? 'Key Influencer'
              : nomineesCount >= 2
                ? 'Active Nominator'
                : 'Participant',
        },
        website: websiteName,
        latestDate,
      });

      excelRow.height = 20;
      excelRow.eachCell((cell, colNum) => {
        cell.border = this.getThinBorders();
        cell.font = { name: 'Calibri', size: 10 };
        if (colNum === 1 || colNum === 14 || colNum === 15) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else if (colNum >= 7 && colNum <= 11) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (colNum === 12) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else if (colNum === 13) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { bold: true, size: 9 };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });
    });

    // Summary Row
    if (nominatorRows.length > 0) {
      const summaryRowNum = nominatorRows.length + 2;
      const lastDataRow = summaryRowNum - 1;
      const summaryRow = dirSheet.addRow({
        sno: '',
        name: 'TOTAL / AVERAGE',
        email: '',
        company: '',
        city: '',
        phone: '',
        nomineesCount: {
          formula: `SUM(G2:G${lastDataRow})`,
          result: totalNomineesProposed,
        },
        submissions: {
          formula: `SUM(H2:H${lastDataRow})`,
          result: totalSubmissions,
        },
        approved: {
          formula: `SUM(I2:I${lastDataRow})`,
          result: totalApprovedNominations,
        },
        pending: {
          formula: `SUM(J2:J${lastDataRow})`,
          result: totalPendingNominations,
        },
        rejected: {
          formula: `SUM(K2:K${lastDataRow})`,
          result: nominatorRows.reduce((a, r) => a + (r.rejectedCount || 0), 0),
        },
        approvalRate: {
          formula: `AVERAGE(L2:L${lastDataRow})`,
          result:
            totalSubmissions > 0
              ? totalApprovedNominations / totalSubmissions
              : 0,
        },
        engagement: '',
        website: '',
        latestDate: '',
      });

      summaryRow.height = 24;
      summaryRow.eachCell((cell, colNum) => {
        cell.font = { bold: true, size: 10, color: { argb: 'FF0F172A' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'double', color: { argb: 'FF475569' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (colNum >= 7 && colNum <= 11) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else if (colNum === 12) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0.0%';
        }
      });
    }

    // ----------------------------------------------------
    // Sheet 3: Detailed Submissions Log
    // ----------------------------------------------------
    const logSheet = workbook.addWorksheet('Submissions Audit Log', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: true }],
    });

    logSheet.columns = [
      { header: 'S.No', key: 'sno', width: 7 },
      { header: 'Submission ID', key: 'subId', width: 24 },
      { header: 'Submission Date', key: 'date', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Nominator Name', key: 'nominatorName', width: 24 },
      { header: 'Nominator Email', key: 'nominatorEmail', width: 26 },
      { header: 'Nominator Company', key: 'nominatorCompany', width: 24 },
      { header: 'Nominator City', key: 'nominatorCity', width: 16 },
      { header: 'Nominator Phone', key: 'nominatorPhone', width: 16 },
      { header: 'Nominee Name', key: 'nomineeName', width: 24 },
      { header: 'Nominee Email', key: 'nomineeEmail', width: 26 },
      { header: 'Nominee Company', key: 'nomineeCompany', width: 24 },
      { header: 'Category', key: 'category', width: 24 },
      { header: 'Subcategory', key: 'subcategory', width: 24 },
      { header: 'Website', key: 'website', width: 20 },
    ];

    const logHeader = logSheet.getRow(1);
    logHeader.height = 28;
    logHeader.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF334155' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = this.getThinBorders();
    });

    submissionRows.forEach((sub, index) => {
      const nomSnap = sub.nominatorSnapshot || {};
      const nomReg = sub.nominator || {};
      const neeSnap = sub.nominees || {};
      const neeReg = sub.nominee || {};

      const excelRow = logSheet.addRow({
        sno: index + 1,
        subId: sub._id.toString(),
        date: sub.createdAt
          ? new Date(sub.createdAt).toISOString().slice(0, 19).replace('T', ' ')
          : '—',
        status: sub.status || 'PENDING',
        nominatorName: nomSnap.name || nomReg.name || '—',
        nominatorEmail: nomSnap.email || nomReg.email || '—',
        nominatorCompany: nomSnap.company || nomReg.organization || '—',
        nominatorCity: nomSnap.city || nomReg.city || '—',
        nominatorPhone: nomSnap.phone || nomReg.phoneNumber || '—',
        nomineeName: neeReg.name || neeSnap.contactName || '—',
        nomineeEmail: neeReg.email || neeSnap.contactEmail || '—',
        nomineeCompany: neeReg.organization || neeSnap.companyName || '—',
        category: sub.category?.name || '—',
        subcategory: sub.subCategory?.name || '—',
        website: sub.website?.name || 'Main Website',
      });

      excelRow.height = 19;
      excelRow.eachCell((cell, colNum) => {
        cell.border = this.getThinBorders();
        cell.font = { name: 'Calibri', size: 9 };
        if (colNum === 1 || colNum === 3 || colNum === 4) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });
    });

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }

  private getThinBorders(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }
}
