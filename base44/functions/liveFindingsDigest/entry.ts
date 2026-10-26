import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Weekly digest compiler for Canada Live: gathers the last 7 days of verified
// intelligence records (DemandSignal) and verified contractor coverage, and
// returns plain-language template variables. Called by the "Live Findings
// Digest" workflow; nothing is sent from here — the workflow's send_email
// step owns the send so it stays visible in the workflow graph.

const DAY_MS = 86400000;

const CATEGORY_LABELS = {
  furniture_appliance_removal: 'Furniture & Appliance Removal',
  moving_downsizing: 'Moving Cleanouts',
  renovation_construction_debris: 'Construction Debris',
  property_management_turnover: 'Property Management',
  recycling_specialty_disposal: 'Recycling & Specialty Disposal',
  commercial_office_cleanouts: 'Commercial Services',
  urgent_same_day: 'Urgent / Same-Day',
  donation_reuse_circular: 'Donation & Reuse',
};

const TYPE_LABELS = {
  observed_public_request: 'observed public request',
  platform_inquiry: 'platform inquiry',
  confirmed_booking: 'confirmed booking',
  search_interest: 'search interest',
  qualified_opportunity: 'qualified opportunity',
  market_indicator: 'market indicator',
};

const SOURCE_LABELS = {
  reddit: 'public community posts',
  google_trends: 'public Google Trends',
  public_forum: 'public forums',
  search_console: 'Google Search Console',
  keyword_dataset: 'keyword datasets',
  recycling_os: 'this platform',
};

const items = (p) => {
  if (!p || p.status !== 'fulfilled') return [];
  const v = p.value;
  return (Array.isArray(v) ? v : v?.items) || [];
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const since = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const [signalsP, partnersP] = await Promise.allSettled([
      base44.asServiceRole.entities.DemandSignal.filter({ created_date: { $gte: since } }, { sort: '-created_date', limit: 300 }),
      base44.asServiceRole.entities.Partner.filter({ active: true, verified: true }, { limit: 500 }),
    ]);

    const signals = items(signalsP);
    const partners = items(partnersP).filter((p) => !p.internal_test);

    // Counts by service category, always kept as their own labelled layer.
    const byCategory = {};
    signals.forEach((s) => (s.market_categories || []).forEach((c) => {
      byCategory[c] = (byCategory[c] || 0) + 1;
    }));
    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, n]) => `${CATEGORY_LABELS[k] || k}: ${n}`);
    const categories_line = topCategories.length ? topCategories.join(' · ') : 'No categorized records this week.';

    // The four most recent verified findings, each labelled with type, source and place.
    const finding = (i) => {
      const s = signals[i];
      if (!s) return 'No further findings this week.';
      const place = [s.city, s.province_code].filter(Boolean).join(', ');
      const type = TYPE_LABELS[s.demand_type] || 'recorded signal';
      const source = SOURCE_LABELS[s.source_platform] || s.source_platform || 'recorded source';
      const title = s.title || 'Recorded signal';
      const typeNote = title.toLowerCase().includes(type) ? '' : ` (${type})`;
      return `${title}${typeNote}, via ${source}${place ? ', ' + place : ''}, ${fmtDate(s.source_published_at || s.created_date)}`;
    };

    const total = signals.length;
    const period = 'the week ending ' + new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });
    const coverage_line = partners.length
      ? `${partners.length} verified contractor${partners.length === 1 ? '' : 's'} active nationwide`
      : 'No verified contractors currently active — requests remain open nationwide.';
    const summary = total
      ? `${total} verified intelligence record${total === 1 ? '' : 's'} collected in ${period}, led by ${topCategories[0] || 'mixed categories'}. Every record is labelled with its type and source; search interest is never counted as customer demand.`
      : `No verified intelligence records were collected in ${period}. An empty week is reported honestly — nothing is estimated.`;

    return Response.json({
      period,
      total,
      summary,
      categories_line,
      coverage_line,
      finding_1: finding(0),
      finding_2: finding(1),
      finding_3: finding(2),
      finding_4: finding(3),
    });
  } catch (e) {
    return Response.json({ error: 'Digest compilation failed.', detail: String(e?.message || e) }, { status: 500 });
  }
}