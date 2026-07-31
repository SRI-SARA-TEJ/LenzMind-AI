/**
 * services/analyticsService.js — Creator Analytics Intelligence
 *
 * Computes aggregated metrics from the Recommendation collection.
 * No new collection is needed — all data lives in existing Recommendation docs.
 *
 * ── What this service provides ────────────────────────────────────────────────
 *  getSummaryStats()     — total/accepted/dismissed/pending + acceptance rate
 *  getAgentBreakdown()   — per-agent counts and acceptance rates
 *  getConfidenceStats()  — average, highest, lowest confidence across all recs
 *  getCreatorInsights()  — most accepted agent, tag frequency, 7-day trend
 *  getFullDashboard()    — all four combined into one round-trip
 *
 * ── Architecture note ────────────────────────────────────────────────────────
 *  All queries are Mongoose aggregation pipelines.  They run against the
 *  'recommendations' collection in MongoDB and are efficient at any scale
 *  because they execute server-side (not in Node).
 *
 *  This service has no dependency on aiService or agentOrchestrator.
 *  It is purely analytical — it reads, never writes.
 */

'use strict';

const Recommendation = require('../models/Recommendation');

// ── Summary stats ─────────────────────────────────────────────────────────────

/**
 * Returns high-level counts and rates across ALL recommendations.
 *
 * @returns {Promise<{
 *   total:          number,
 *   accepted:       number,
 *   dismissed:      number,
 *   pending:        number,
 *   acceptanceRate: number,   // 0–100 percentage, rounded to 1 dp
 *   dismissalRate:  number,
 * }>}
 */
async function getSummaryStats() {
  const [result] = await Recommendation.aggregate([
    {
      $group: {
        _id:       null,
        total:     { $sum: 1 },
        accepted:  { $sum: { $cond: [{ $eq: ['$userAction', 'accepted']  }, 1, 0] } },
        dismissed: { $sum: { $cond: [{ $eq: ['$userAction', 'dismissed'] }, 1, 0] } },
        pending:   { $sum: { $cond: [{ $eq: ['$userAction', 'pending']   }, 1, 0] } },
      },
    },
  ]);

  if (!result) {
    return { total: 0, accepted: 0, dismissed: 0, pending: 0, acceptanceRate: 0, dismissalRate: 0 };
  }

  const resolved = result.accepted + result.dismissed;
  const acceptanceRate = resolved > 0
    ? Math.round((result.accepted / resolved) * 1000) / 10
    : 0;
  const dismissalRate = resolved > 0
    ? Math.round((result.dismissed / resolved) * 1000) / 10
    : 0;

  return {
    total:          result.total,
    accepted:       result.accepted,
    dismissed:      result.dismissed,
    pending:        result.pending,
    acceptanceRate,
    dismissalRate,
  };
}

// ── Per-agent breakdown ───────────────────────────────────────────────────────

/**
 * Returns per-agent counts and acceptance rates.
 *
 * @returns {Promise<Array<{
 *   agentType:      string,
 *   total:          number,
 *   accepted:       number,
 *   dismissed:      number,
 *   pending:        number,
 *   acceptanceRate: number,
 * }>>}
 */
async function getAgentBreakdown() {
  const rows = await Recommendation.aggregate([
    {
      $group: {
        _id:       '$agentType',
        total:     { $sum: 1 },
        accepted:  { $sum: { $cond: [{ $eq: ['$userAction', 'accepted']  }, 1, 0] } },
        dismissed: { $sum: { $cond: [{ $eq: ['$userAction', 'dismissed'] }, 1, 0] } },
        pending:   { $sum: { $cond: [{ $eq: ['$userAction', 'pending']   }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return rows.map(function(row) {
    const resolved       = row.accepted + row.dismissed;
    const acceptanceRate = resolved > 0
      ? Math.round((row.accepted / resolved) * 1000) / 10
      : 0;
    return {
      agentType:      row._id,
      total:          row.total,
      accepted:       row.accepted,
      dismissed:      row.dismissed,
      pending:        row.pending,
      acceptanceRate,
    };
  });
}

// ── Confidence statistics ────────────────────────────────────────────────────

/**
 * Returns average, highest, and lowest confidence scores.
 * Only includes recommendations where confidence is a real number (not null).
 *
 * @returns {Promise<{
 *   avg:     number|null,
 *   highest: number|null,
 *   lowest:  number|null,
 *   count:   number,        // how many recs had a non-null confidence score
 * }>}
 */
async function getConfidenceStats() {
  const [result] = await Recommendation.aggregate([
    { $match: { confidence: { $ne: null, $type: 'number' } } },
    {
      $group: {
        _id:     null,
        avg:     { $avg: '$confidence' },
        highest: { $max: '$confidence' },
        lowest:  { $min: '$confidence' },
        count:   { $sum: 1 },
      },
    },
  ]);

  if (!result) {
    return { avg: null, highest: null, lowest: null, count: 0 };
  }

  return {
    avg:     Math.round(result.avg     * 100) / 100,
    highest: Math.round(result.highest * 100) / 100,
    lowest:  Math.round(result.lowest  * 100) / 100,
    count:   result.count,
  };
}

// ── Creator insights ─────────────────────────────────────────────────────────

/**
 * Returns higher-level patterns from the creator's decision history:
 *  - mostAcceptedAgent:  which agent gets the most accepted recommendations
 *  - topTags:            top-5 tags across accepted recommendations
 *  - weeklyTrend:        acceptance counts per day for the last 7 days
 *
 * @returns {Promise<{
 *   mostAcceptedAgent: string|null,
 *   topTags:           Array<{ tag: string, count: number }>,
 *   weeklyTrend:       Array<{ date: string, accepted: number, dismissed: number }>,
 * }>}
 */
async function getCreatorInsights() {
  // ── Most accepted agent ────────────────────────────────────────
  const [topAgent] = await Recommendation.aggregate([
    { $match: { userAction: 'accepted' } },
    { $group: { _id: '$agentType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  // ── Top tags from accepted recommendations ─────────────────────
  const tagRows = await Recommendation.aggregate([
    { $match: { userAction: 'accepted', tags: { $exists: true, $ne: [] } } },
    { $unwind: '$tags' },
    // Exclude noisy/redundant system tags
    { $match: { tags: { $nin: ['mock', 'error'] } } },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // ── 7-day daily trend ──────────────────────────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const trendRows = await Recommendation.aggregate([
    {
      $match: {
        userAction: { $in: ['accepted', 'dismissed'] },
        createdAt:  { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          date:   { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          action: '$userAction',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  // Normalise trend into one entry per day with both counters
  const trendMap = {};
  trendRows.forEach(function(row) {
    const date = row._id.date;
    if (!trendMap[date]) trendMap[date] = { date, accepted: 0, dismissed: 0 };
    trendMap[date][row._id.action] = row.count;
  });

  // Fill in the last 7 days even if there are no recommendations for that day
  const weeklyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    weeklyTrend.push(trendMap[key] || { date: key, accepted: 0, dismissed: 0 });
  }

  return {
    mostAcceptedAgent: topAgent ? topAgent._id : null,
    topTags:           tagRows.map(function(r) { return { tag: r._id, count: r.count }; }),
    weeklyTrend,
  };
}

// ── Full dashboard (single round-trip) ───────────────────────────────────────

/**
 * Fetches all four analytics datasets in parallel.
 * Controllers call this to serve the analytics dashboard in one request.
 *
 * @returns {Promise<{
 *   summary:   object,
 *   agents:    Array,
 *   confidence: object,
 *   insights:  object,
 * }>}
 */
async function getFullDashboard() {
  const [summary, agents, confidence, insights] = await Promise.all([
    getSummaryStats(),
    getAgentBreakdown(),
    getConfidenceStats(),
    getCreatorInsights(),
  ]);
  return { summary, agents, confidence, insights };
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  getSummaryStats,
  getAgentBreakdown,
  getConfidenceStats,
  getCreatorInsights,
  getFullDashboard,
};
