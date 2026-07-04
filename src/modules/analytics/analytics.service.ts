import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalyticsEvent } from './schemas/analytics-event.schema';
import { TrackEventDto } from './dto/track-event.dto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsEventModel: Model<AnalyticsEvent>,
  ) {}

  async trackEvent(websiteId: string, dto: TrackEventDto): Promise<AnalyticsEvent> {
    const event = new this.analyticsEventModel({
      ...dto,
      websiteId: new Types.ObjectId(websiteId),
    });
    return event.save();
  }

  async getSummary(websiteId: string, query: AnalyticsQueryDto): Promise<any> {
    const matchStage: any = {
      websiteId: new Types.ObjectId(websiteId),
      isDeleted: { $ne: true },
    };

    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    matchStage.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };

    // Aggregate stats using facets for single-trip DB querying efficiency
    const baseAgg = await this.analyticsEventModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          metrics: [
            {
              $group: {
                _id: null,
                totalPageViews: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'pageview'] }, 1, 0] },
                },
                totalConsentAccepts: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'consent_accepted'] }, 1, 0] },
                },
                totalConsentDeclines: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'consent_declined'] }, 1, 0] },
                },
                visitors: { $addToSet: '$visitorId' },
                sessions: { $addToSet: '$sessionId' },
              },
            },
            {
              $project: {
                _id: 0,
                pageViews: '$totalPageViews',
                consentAccepts: '$totalConsentAccepts',
                consentDeclines: '$totalConsentDeclines',
                uniqueVisitors: { $size: '$visitors' },
                sessions: { $size: '$sessions' },
              },
            },
          ],
          topPages: [
            { $match: { eventType: 'pageview' } },
            {
              $group: {
                _id: { pageUrl: '$pageUrl', pageTitle: '$pageTitle' },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                pageUrl: '$_id.pageUrl',
                pageTitle: '$_id.pageTitle',
                count: 1,
              },
            },
          ],
          topReferrers: [
            { $match: { eventType: 'pageview' } },
            {
              $group: {
                _id: '$referrer',
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                referrer: { $ifNull: ['$_id', 'direct'] },
                count: 1,
              },
            },
          ],
          dailyTrend: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                pageViews: {
                  $sum: { $cond: [{ $eq: ['$eventType', 'pageview'] }, 1, 0] },
                },
                visitors: { $addToSet: '$visitorId' },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: '$_id',
                pageViews: 1,
                uniqueVisitors: { $size: '$visitors' },
              },
            },
          ],
        },
      },
    ]);

    // Fetch last 50 events for the activity log table
    const recentActivity = await this.analyticsEventModel
      .find(matchStage)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const result = baseAgg[0] || {};
    const metrics = result.metrics?.[0] || {
      pageViews: 0,
      consentAccepts: 0,
      consentDeclines: 0,
      uniqueVisitors: 0,
      sessions: 0,
    };

    const consentTotal = (metrics.consentAccepts || 0) + (metrics.consentDeclines || 0);
    const consentRate = consentTotal > 0 ? Math.round((metrics.consentAccepts / consentTotal) * 100) : 0;

    return {
      metrics: {
        pageViews: metrics.pageViews || 0,
        uniqueVisitors: metrics.uniqueVisitors || 0,
        sessions: metrics.sessions || 0,
        consentAccepts: metrics.consentAccepts || 0,
        consentDeclines: metrics.consentDeclines || 0,
        consentRate,
      },
      topPages: result.topPages || [],
      topReferrers: result.topReferrers || [],
      dailyTrend: result.dailyTrend || [],
      recentActivity,
    };
  }
}
