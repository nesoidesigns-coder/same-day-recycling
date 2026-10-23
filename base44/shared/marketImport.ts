import { normalizeCategory, normalizeCompetition, PROVINCES } from './demand.ts';

const measures = ['monthly_volume','monthly_average','relative_interest','estimated_organic_clicks','estimated_paid_clicks'];
const providers = ['keyword_planner','dataforseo','semrush','google_trends','licensed_import'];
const month = (p) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(p || ''));
const text = (v) => String(v ?? '').trim();
function number(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null;
  const s = text(v);
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) return null;
  const n = Number(s.replaceAll(',','')); return Number.isFinite(n) ? n : null;
}
export function normalizeDemandRows(rows, meta) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 500) throw new Error('Provide 1–500 observations per import.');
  if (!providers.includes(meta.provider)) throw new Error('Choose the original market data provider.');
  if (meta.confirmed !== true) throw new Error('Confirm the dataset is licensed, Canada-specific industry data.');
  const source = text(meta.source_label), url = text(meta.source_url), method = text(meta.methodology_note), cadence = text(meta.update_cadence);
  if (!source || source.length > 120 || !/^https:\/\/[^\s]+$/.test(url) || url.length > 600 || !method || method.length > 1000 || !cadence || cadence.length > 200) throw new Error('A source label, HTTPS source link, methodology and provider reporting cadence are required.');
  const now = new Date().toISOString();
  const records = rows.map((r, i) => {
    const fail = (message) => { throw new Error(`Row ${i+1}: ${message}`); };
    const keyword = text(r.keyword), engine = text(r.search_engine || meta.search_engine), period = text(r.period || meta.period);
    const country = text(r.country_code || meta.country_code).toUpperCase();
    const metric = text(r.metric_type || meta.metric_type);
    const rawProvince = text(r.province_code || r.province);
    const province = PROVINCES.find(([c,n]) => c.toLowerCase() === rawProvince.toLowerCase() || n.toLowerCase() === rawProvince.toLowerCase())?.[0] || '';
    const city = text(r.city), geo = text(r.geo_type) || (city ? 'city' : rawProvince ? 'province' : 'national');
    if (!keyword || keyword.length > 200) fail('a keyword of 1–200 characters is required.');
    if (country !== 'CA') fail('only explicit Canadian (CA) data is accepted; global figures cannot be relabeled.');
    if (!['google','bing'].includes(engine)) fail('specify a supported search engine (google or bing); combined or unknown engine totals are not accepted.');
    if (!month(period) || period > now.slice(0,7)) fail('a real source reporting month (YYYY-MM), not a future month, is required.');
    if (!measures.includes(metric)) fail('choose an explicit measure; search counts, click estimates and interest indices are separate.');
    if (!['national','province','city'].includes(geo) || (geo === 'national' && (city || rawProvince)) || (geo === 'province' && (!province || city)) || (geo === 'city' && (!city || !province))) fail('geography must be national, a valid province, or a city with its province.');
    if (rawProvince && !province) fail('unrecognized province/territory.');
    const isIndex = metric === 'relative_interest', isClick = metric.startsWith('estimated_');
    const value = number(isIndex ? r.trend_index : isClick ? r.estimated_clicks : r.est_monthly_volume);
    if (value === null || (isIndex && value > 100)) fail('a non-negative source value is required (Trends indices must be 0–100); blanks are never zero-filled.');
    const group = text(r.comparison_group);
    if (isIndex && (!group || meta.provider !== 'google_trends' || engine !== 'google')) fail('Trends requires the Google Trends source, Google engine and its original comparison window.');
    if (meta.provider === 'google_trends' && !isIndex) fail('Trends cannot supply search counts or clicks.');
    if (isClick && (meta.provider === 'keyword_planner' || !text(meta.methodology_note))) fail('click estimates require a third-party industry click dataset and its methodology.');
    const start = text(r.period_start || meta.period_start), end = text(r.period_end || meta.period_end);
    if (metric === 'monthly_average' && (!month(start) || !month(end) || start > end || end !== period)) fail('rolling averages need their original start and end months, ending in the reporting month.');
    const variants = Array.isArray(r.close_variants) ? r.close_variants : text(r.close_variants).split('|');
    return { keyword, search_engine:engine, country_code:'CA', provider:meta.provider, geo_type:geo, geo_key:geo === 'national' ? 'CA' : geo === 'province' ? province : city, province_code:province, city,
      service_category:normalizeCategory(r.service_category || keyword), metric_type:metric, period, period_start:start || period, period_end:end || period,
      est_monthly_volume:isIndex || isClick ? 0 : value, ...(isClick ? {estimated_clicks:value} : {}), trend_index:isIndex ? value : 0,
      comparison_group:group.slice(0,120), close_variants:variants.map(text).filter(Boolean).slice(0,30), competition:normalizeCompetition(r.competition), trend_direction:'unknown',
      volume_basis:isIndex ? 'google_trends' : ['keyword_planner','dataforseo','semrush'].includes(meta.provider) ? meta.provider : 'published_estimate',
      source, source_url:url, methodology_note:method, update_cadence:cadence, last_updated:now.slice(0,10), retrieved_at:now };
  });
  const seen = new Set();
  for (const r of records) { const key = observationKey(r); if (seen.has(key)) throw new Error('The file contains duplicate keyword/engine/measure/geography/month rows. Resolve them in the source export first.'); seen.add(key); }
  return records;
}
export const observationKey = (r) => [r.keyword?.toLowerCase(),r.search_engine,r.provider,r.source,r.geo_type,r.geo_key?.toLowerCase(),r.province_code,r.metric_type,r.period,r.comparison_group || ''].join('|');