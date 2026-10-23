import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeCategory, normalizeCompetition, currentPeriod } from '../../shared/demand.ts';

// Admin-only import of verified demand observations (e.g. a Google Ads
// Keyword Planner export). Every imported row is stored with its source label
// so public figures always carry their provenance.
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
    const volumeBasis = ['keyword_planner', 'published_estimate', 'admin_import'].includes(payload.volume_basis)
      ? payload.volume_basis
      : 'keyword_planner';
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
                keyword: { type: 'string', description: 'Canonical search keyword. Merge overlapping variants (e.g. "couch removal Vancouver" and "sofa removal Vancouver" only if the source reports them as one keyword).' },
                service_category: { type: 'string', description: 'One of: junk_removal, furniture_removal, appliance_removal, electronics, recycling, waste_disposal, estate_cleanout, construction_debris, other.' },
                province: { type: 'string', description: 'Province or territory name or code, empty for national rows.' },
                city: { type: 'string', description: 'City name, empty for province or national rows.' },
                est_monthly_volume: { type: 'number', description: 'Estimated monthly searches.' },
                trend_index: { type: 'number', description: 'Relative interest index 0-100 if provided, otherwise 0.' },
                trend_direction: { type: 'string', description: 'rising, steady or falling if known.' },
                competition: { type: 'string', description: 'low, medium or high if provided.' },
                period: { type: 'string', description: 'YYYY-MM the volume applies to.' },
              },
              required: ['keyword', 'est_monthly_volume'],
            },
          },
        },
        required: ['rows'],
      },
    });

    if (extracted.status !== 'success' || !extracted.output?.rows) {
      return Response.json({ error: extracted.details || 'Could not extract rows from the file. Expected columns: keyword, service_category, province, city, est_monthly_volume, trend_index, competition, period.' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const fallbackPeriod = currentPeriod();
    const records = [];
    const skipped = [];
    for (const row of extracted.output.rows) {
      const keyword = String(row.keyword || '').trim();
      if (!keyword) { skipped.push('Row missing keyword'); continue; }
      const volume = Number(row.est_monthly_volume) || 0;
      const city = String(row.city || '').trim();
      const provinceRaw = String(row.province || '').trim();
      const provinceCode = (provinceRaw || '').toUpperCase().slice(0, 2);
      const geoType = city ? 'city' : provinceRaw ? 'province' : 'national';
      const geoKey = city || provinceCode || 'CA';
      const period = /^\d{4}-\d{2}$/.test(String(row.period || '')) ? row.period : fallbackPeriod;
      records.push({
        geo_type: geoType,
        geo_key: geoKey,
        province_code: city ? '' : provinceCode,
        city,
        service_category: normalizeCategory(row.service_category),
        keyword,
        period,
        est_monthly_volume: volume,
        volume_basis: volumeBasis,
        trend_index: Number(row.trend_index) || 0,
        trend_direction: ['rising', 'steady', 'falling'].includes(String(row.trend_direction || '')) ? row.trend_direction : 'unknown',
        competition: normalizeCompetition(row.competition),
        source: sourceLabel || 'Admin CSV import',
        methodology_note: `Imported ${today}; ${volumeBasis === 'keyword_planner' ? 'Google Ads Keyword Planner estimate' : volumeBasis === 'published_estimate' ? 'published industry estimate' : 'admin-recorded estimate'}.`,
        last_updated: today,
      });
    }

    if (!records.length) return Response.json({ error: 'No valid rows found in the file.' }, { status: 400 });

    const created = await base44.asServiceRole.entities.DemandObservation.bulkCreate(records);
    await base44.asServiceRole.entities.DemandSyncLog.create({
      source: 'import',
      status: 'success',
      run_date: today,
      started_at: new Date().toISOString(),
      records_upserted: records.length,
      period: fallbackPeriod,
      coverage_note: `Imported ${records.length} observations (basis: ${volumeBasis}, source: ${sourceLabel || 'Admin CSV import'}). Skipped: ${skipped.length}.`,
      next_update_cadence: 'Manual / on import',
    });

    return Response.json({ ok: true, created: records.length, skipped, volume_basis: volumeBasis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}