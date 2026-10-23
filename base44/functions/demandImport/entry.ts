import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeCategory, normalizeCompetition, currentPeriod } from '../../shared/demand.ts';

// Admin-only import of verified demand observations (e.g. a Google Ads
// Keyword Planner export or a Google Trends CSV export). Every imported row is
// stored with its source label and measure type so public figures always
// carry their provenance and are never mixed across measures.
const MEASURES = ['monthly_volume', 'monthly_average', 'relative_interest', 'unspecified_estimate'];
const BASES = ['keyword_planner', 'google_trends', 'published_estimate', 'admin_import'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const fileUri = String(payload.file_uri || '').trim();
    const sourceLabel = String(payload.source_label || '').trim().slice(0, 120);
    const volumeBasis = BASES.includes(payload.volume_basis) ? payload.volume_basis : 'keyword_planner';
    const metricType = MEASURES.includes(payload.metric_type) ? payload.metric_type : 'unspecified_estimate';
    if (!fileUri) return Response.json({ error: 'file_uri is required' }, { status: 400 });

    const { file_url: signedUrl } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 300 });

    const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url: signedUrl,
      json_schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string', description: 'Canonical search keyword; overlapping variants are only merged when the source reports them as one keyword.' },
                close_variants: { type: 'string', description: 'Comma-separated variants included in this keyword volume, if the source lists them.' },
                service_category: { type: 'string', description: 'One of: junk_removal, furniture_removal, appliance_removal, electronics, recycling, waste_disposal, estate_cleanout, construction_debris, demolition_cleanup, other.' },
                province: { type: 'string', description: 'Province or territory name or code, empty for national rows.' },
                city: { type: 'string', description: 'City name, empty for province or national rows.' },
                est_monthly_volume: { type: 'number', description: 'Estimated monthly searches (0 for index-only rows).' },
                trend_index: { type: 'number', description: 'Relative interest index 0-100 if provided, otherwise 0.' },
                comparison_group: { type: 'string', description: 'Export window identifier for Trends samples (e.g. 2026-01-01_2026-12-31_canada).' },
                trend_direction: { type: 'string', description: 'rising, steady or falling if known.' },
                competition: { type: 'string', description: 'low, medium or high if provided.' },
                period: { type: 'string', description: 'YYYY-MM the value applies to.' },
              },
              required: ['keyword', 'est_monthly_volume'],
            },
          },
        },
        required: ['rows'],
      },
    });

    if (extracted.status !== 'success' || !extracted.output?.rows) {
      return Response.json({ error: extracted.details || 'Could not extract rows from the file. Expected columns: keyword, service_category, province, city, est_monthly_volume, trend_index, comparison_group, competition, period.' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const fallbackPeriod = currentPeriod();
    const records = [];
    const skipped = [];
    for (const row of extracted.output.rows) {
      const keyword = String(row.keyword || '').trim();
      if (!keyword) { skipped.push('Row missing keyword'); continue; }
      const city = String(row.city || '').trim();
      const provinceRaw = String(row.province || '').trim();
      const provinceCode = (provinceRaw || '').toUpperCase().slice(0, 2);
      const geoType = city ? 'city' : provinceRaw ? 'province' : 'national';
      const geoKey = city || provinceCode || 'CA';
      const period = /^\d{4}-\d{2}$/.test(String(row.period || '')) ? row.period : fallbackPeriod;
      const isIndex = metricType === 'relative_interest' || volumeBasis === 'google_trends';
      const volume = Number(row.est_monthly_volume) || 0;
      const trendIndex = Number(row.trend_index) || 0;
      if (isIndex && !(trendIndex > 0) && !(volume > 0)) { skipped.push(`Row "${keyword}" has no usable index value`); continue; }
      if (!isIndex && !(volume > 0)) { skipped.push(`Row "${keyword}" has no volume value`); continue; }
      records.push({
        geo_type: geoType,
        geo_key: geoKey,
        province_code: city ? '' : provinceCode,
        city,
        service_category: normalizeCategory(row.service_category),
        keyword,
        close_variants: String(row.close_variants || '').split(',').map((v) => v.trim()).filter(Boolean).slice(0, 20),
        period,
        metric_type: isIndex ? 'relative_interest' : metricType === 'relative_interest' ? 'unspecified_estimate' : metricType,
        est_monthly_volume: isIndex ? 0 : volume,
        volume_basis: isIndex ? 'google_trends' : volumeBasis,
        trend_index: isIndex ? (trendIndex || volume) : trendIndex,
        comparison_group: String(row.comparison_group || '').trim().slice(0, 120),
        trend_direction: ['rising', 'steady', 'falling'].includes(String(row.trend_direction || '')) ? row.trend_direction : 'unknown',
        competition: normalizeCompetition(row.competition),
        source: sourceLabel || (isIndex ? 'Google Trends CSV export' : 'Admin CSV import'),
        methodology_note: `Imported ${today}; ${isIndex ? 'sampled relative-interest index from a Trends export (never a search count)' : metricType === 'monthly_average' ? '12-month rolling average as reported by the source' : 'monthly search-volume estimate as reported by the source'}.`,
        last_updated: today,
      });
    }

    if (!records.length) return Response.json({ error: 'No valid rows found in the file.', skipped }, { status: 400 });

    const created = await base44.asServiceRole.entities.DemandObservation.bulkCreate(records);
    await base44.asServiceRole.entities.DemandSyncLog.create({
      source: 'import',
      status: 'success',
      run_date: today,
      started_at: new Date().toISOString(),
      records_upserted: records.length,
      period: fallbackPeriod,
      coverage_note: `Imported ${records.length} observations (basis: ${volumeBasis}, measure: ${metricType}, source: ${sourceLabel || 'Admin CSV import'}). Skipped: ${skipped.length}.`,
      next_update_cadence: 'Manual / on import',
    });

    return Response.json({ ok: true, created: records.length, skipped, volume_basis: volumeBasis, metric_type: metricType });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}