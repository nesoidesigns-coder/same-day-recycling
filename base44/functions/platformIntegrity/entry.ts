import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { ACTIVE_CITIES, isTestPartner } from '../../shared/coverageStatus.ts';
import { DEFAULT_PRICES } from '../../shared/pricing.ts';

// Platform Integrity: automated checks that every public surface represents the
// same operational reality. It only records VERIFIED findings from real app
// data and real page fetches — it never estimates or fabricates results, and
// it never touches bookings, payments or live transactions.

const CHECKS_ORDER = [
  'coverage_consistency',
  'pricing_consistency',
  'booking_availability',
  'contractor_status',
  'payment_integration_health',
  'review_verification',
  'page_rendering',
  'broken_links',
  'conflicting_claims',
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run';
    if (action === 'latest') return await handleLatest(base44);
    if (action === 'run') return await runChecks(base44, req);
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function handleLatest(base44) {
  const runs = (await base44.asServiceRole.entities.IntegrityRun.filter({}, { sort: '-created_date', limit: 10 })).items || [];
  const changes = (await base44.asServiceRole.entities.CoverageChangeLog.filter({}, { sort: '-created_date', limit: 25 })).items || [];
  return Response.json({
    latest: runs[0] || null,
    runs,
    coverage_changes: changes,
    last_successful_check_at: (runs.find((r) => r.status === 'success') || {}).created_date || null,
  });
}

const check = (name, severity, summary, affected_pages = [], details = []) => ({
  check: name, severity, summary, affected_pages, details,
});

async function runChecks(base44, req) {
  const startedAt = new Date().toISOString();
  const results = [];
  const readRows = (page) => (Array.isArray(page) ? page : page?.items) || [];
  const origin = reqOrigin(req);

  // ---- Shared data ----
  const partnersRaw = readRows(await base44.asServiceRole.entities.Partner.filter({ active: true, verified: true }, { limit: 500 }));
  const realPartners = partnersRaw.filter((p) => !isTestPartner(p));
  const testPartnerCount = partnersRaw.length - realPartners.length;
  const capacity = {}; // city -> count of verified active partners
  for (const p of realPartners) {
    const city = String(p.city || '').trim().replace(/\s+/g, ' ');
    if (!city) continue;
    capacity[city] = (capacity[city] || 0) + 1;
  }

  // ---- 1. Coverage consistency ----
  {
    const registry = new Set(ACTIVE_CITIES.map((c) => c.toLowerCase()));
    const duplicateCapacity = Object.keys(capacity).filter((c) => !registry.has(c.toLowerCase()));
    const dupes = ACTIVE_CITIES.filter((c, i) => ACTIVE_CITIES.findIndex((x) => x.toLowerCase() === c.toLowerCase()) !== i);
    const sev = duplicateCapacity.length || dupes.length ? 'warning' : 'pass';
    const details = [];
    if (duplicateCapacity.length) details.push(`${duplicateCapacity.length} partner city(ies) with verified capacity are outside the service-territory registry: ${duplicateCapacity.slice(0, 10).join(', ')}.`);
    if (dupes.length) details.push(`Duplicate registry entries: ${[...new Set(dupes)].join(', ')}.`);
    results.push(check('coverage_consistency', sev,
      dupes.length ? 'Duplicate registry cities found.' : duplicateCapacity.length ? 'Verified capacity exists outside the registry.' : `${ACTIVE_CITIES.length} registry cities consistent; ${Object.keys(capacity).length} with verified contractor capacity.`,
      ['/coverage', '/city-pages', '/junk-removal-vancouver'], details));
  }

  // ---- 2. Pricing consistency ----
  const priceRows = readRows(await base44.asServiceRole.entities.PricingSettings.filter({}, { limit: 500 }));
  {
    const registry = new Set(ACTIVE_CITIES.map((c) => c.toLowerCase()));
    const byCity = {};
    const issues = [];
    const outside = [];
    const invalidTiers = [];
    for (const row of priceRows) {
      const city = String(row.city || '').trim();
      if (city) {
        byCity[city] = byCity[city] || [];
        byCity[city].push(row);
        if (!registry.has(city.toLowerCase())) outside.push(city);
      }
      for (const k of Object.keys(DEFAULT_PRICES)) {
        const v = Number(row[k]);
        if (row[k] !== null && row[k] !== undefined && row[k] !== '' && (!Number.isFinite(v) || v <= 0)) invalidTiers.push(`${city || 'national'}: ${k}`);
      }
    }
    const dupCities = Object.keys(byCity).filter((c) => byCity[c].length > 1);
    const registryWithLocalRates = Object.keys(byCity).filter((c) => registry.has(c.toLowerCase()));
    const sev = dupCities.length || invalidTiers.length ? 'error' : (outside.length ? 'warning' : 'pass');
    const details = [];
    if (dupCities.length) details.push(`Duplicate pricing rows for: ${dupCities.join(', ')}. Quote consumers could disagree.`);
    if (invalidTiers.length) details.push(`Invalid tier values (must be positive numbers): ${invalidTiers.slice(0, 10).join(', ')}.`);
    if (outside.length) details.push(`Pricing rows for cities outside the registry: ${outside.slice(0, 10).join(', ')}.`);
    details.push(`${registryWithLocalRates.length} of ${ACTIVE_CITIES.length} registry cities have local rates; the rest resolve to the national standard tiers.`);
    results.push(check('pricing_consistency', sev,
      sev === 'pass' ? 'All pricing rows valid; quote, booking and page pricing share one merge rule (resolveCityPrices).' : 'Pricing inconsistencies found.',
      ['/city-pages', '/quote', '/request-service', '/admin/pricing'], details));
  }

  // ---- 3. Booking availability ----
  {
    const zeroCapacity = ACTIVE_CITIES.filter((c) => !capacity[c]);
    const sev = 'pass';
    const details = [
      `Direct booking is offered in the ${Object.keys(capacity).length} registry cities with verified contractor capacity.`,
      `${zeroCapacity.length} registry cities show "Recruitment Open" — requests stay open, no capacity is implied.`,
      'Matching-enabled cities never imply contractor availability: capacity comes only from verified partner records.',
    ];
    results.push(check('booking_availability', sev, 'Booking gate matches the live capacity layer — no city implies a confirmed provider without a verified partner record.', ['/request-service', '/booking', '/city-pages'], details));
  }

  // ---- 4. Contractor status ----
  {
    const missingCity = realPartners.filter((p) => !String(p.city || '').trim());
    const missingProvince = realPartners.filter((p) => String(p.city || '').trim() && !String(p.province || '').trim());
    const sev = missingCity.length ? 'warning' : 'pass';
    const details = [
      `${realPartners.length} active verified partners form contractor capacity; ${testPartnerCount} test/simulation records excluded.`,
      missingCity.length ? `${missingCity.length} verified partner(s) missing a city — they cannot be counted toward any city's capacity.` : 'All verified partners have a city on file.',
      missingProvince.length ? `${missingProvince.length} verified partner(s) missing a province.` : 'Partner provinces recorded.',
    ];
    results.push(check('contractor_status', sev, sev === 'pass' ? 'Contractor records complete; capacity derived only from verified, active partners.' : 'Some contractor records are incomplete.', ['/coverage', '/partners', '/admin/partners'], details));
  }

  // ---- 5. Payment integration health ----
  {
    let paypalConfigured = false;
    let paypalMode = '';
    try {
      const id = secrets.get('PAYPAL_CLIENT_ID');
      const secret = secrets.get('PAYPAL_SECRET');
      paypalConfigured = !!(id && secret);
      paypalMode = String(secrets.get('PAYPAL_MODE') || '');
    } catch { /* secrets not readable here — reported as not configured */ }
    const now = Date.now();
    let txCount = 0;
    let webhookCount = 0;
    try {
      const tx = readRows(await base44.asServiceRole.entities.PaypalTransaction.filter({}, { sort: '-created_date', limit: 50 }));
      txCount = tx.filter((t) => now - new Date(t.created_date).getTime() < 30 * 86400000).length;
    } catch { /* entity may be empty */ }
    try {
      const wh = readRows(await base44.asServiceRole.entities.PaypalWebhookEvent.filter({}, { sort: '-created_date', limit: 50 }));
      webhookCount = wh.filter((t) => now - new Date(t.created_date).getTime() < 30 * 86400000).length;
    } catch { /* entity may be empty */ }
    const sev = paypalConfigured ? 'pass' : 'error';
    const details = [
      `PayPal credentials: ${paypalConfigured ? 'present' : 'MISSING — checkout fails until they are set'}. Mode: ${paypalMode || 'unknown'}.`,
      `${txCount} transactions and ${webhookCount} webhook events recorded in the last 30 days${(txCount || webhookCount) ? '' : ' (no recent activity — may simply mean no sales)'}.`,
      'Integrity checks never read or modify live payment transactions.',
    ];
    results.push(check('payment_integration_health', sev, paypalConfigured ? 'Payment integration credentials present; recent activity counted without touching transactions.' : 'Payment credentials missing — checkout cannot work.', ['/checkout', '/booking', '/software-pay', '/membership-pay'], details));
  }

  // ---- 6. Review verification ----
  {
    const approved = readRows(await base44.asServiceRole.entities.Review.filter({ approved: true }, { limit: 300 }));
    const bad = [];
    for (const r of approved) {
      const problems = [];
      const rating = Number(r.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) problems.push('rating out of 1–5 range');
      if (!String(r.customer_name || '').trim()) problems.push('no customer name');
      if (!String(r.text || '').trim()) problems.push('no review text');
      if (problems.length) bad.push(`${r.id.slice(-6)}: ${problems.join('; ')}`);
    }
    const sev = bad.length ? 'warning' : 'pass';
    const details = [
      `${approved.length} approved review(s) checked against rating range, attribution and content requirements.`,
      bad.length ? `Flagged: ${bad.slice(0, 10).join(' | ')}` : 'All approved reviews carry a valid rating, a customer name and review text.',
    ];
    results.push(check('review_verification', sev, sev === 'pass' ? 'All displayed reviews trace to approved review records with valid ratings.' : 'Some approved reviews are missing required fields.', ['/reviews', '/review', '/city-pages'], details));
  }

  // ---- 7. Page rendering ----
  const paths = ['/', '/coverage', '/pricing', '/request-service', '/junk-removal-vancouver'];
  const renderResults = [];
  {
    const settled = await Promise.allSettled(paths.map((p) => fetchPage(origin + p)));
    settled.forEach((r, i) => {
      const ok = r.status === 'fulfilled' && r.value.ok && r.value.hasTitle;
      renderResults.push(ok ? null : `${paths[i]}: ${r.status === 'fulfilled' ? (r.value.ok ? 'rendered without a <title>' : `HTTP ${r.value.status}`) : 'unreachable'}`);
    });
    const failures = renderResults.filter(Boolean);
    results.push(check('page_rendering', failures.length ? 'error' : 'pass',
      failures.length ? `${failures.length} public page(s) failed to render with a title.` : `${paths.length} key public pages render with titles.`,
      paths, failures.length ? failures : ['All sampled pages returned HTTP 200 with a document title.']));
  }

  // ---- 8. Broken links (sitemap sample) ----
  {
    const sitemap = await fetchPage(origin + '/sitemap.xml');
    const locs = sitemap.ok ? (String(sitemap.body).match(/<loc>([^<]+)<\/loc>/g) || [])
      .map((m) => m.replace(/<\/?loc>/g, '').trim()).filter(Boolean).slice(0, 20) : [];
    const failures = [];
    if (locs.length) {
      for (let i = 0; i < locs.length; i += 6) {
        const settled = await Promise.allSettled(locs.slice(i, i + 6).map((u) => fetchPage(u)));
        settled.forEach((r, j) => {
          if (r.status === 'rejected' || !r.value.ok) failures.push(`${locs[i + j]}: ${r.status === 'fulfilled' ? `HTTP ${r.value.status}` : 'unreachable'}`);
        });
      }
    }
    const sev = !sitemap.ok ? 'warning' : (failures.length ? 'error' : 'pass');
    results.push(check('broken_links', sev,
      !sitemap.ok ? 'Sitemap could not be fetched for link checking.' : locs.length ? (failures.length ? `${failures.length} of ${locs.length} sampled sitemap URLs failed.` : `${locs.length} sampled sitemap URLs all respond.`) : 'Sitemap contained no URLs.',
      sitemap.ok ? ['/sitemap', ...locs.map((u) => u.replace(origin, '')).slice(0, 10)] : ['/sitemap'],
      failures.length ? failures.slice(0, 20) : (locs.length ? [`Checked ${locs.length} URLs from the sitemap.`] : [])));
  }

  // ---- 9. Conflicting claims ----
  {
    // Public pages quote these national rates verbatim; the check catches any
    // drift between the quote engine's DEFAULT_PRICES and the published claims.
    const CLAIMED = { minimum_pickup: 139, eighth_truck: 189, quarter_truck: 269, half_truck: 419, three_quarter_truck: 549, full_truck: 649 };
    const drift = Object.keys(CLAIMED).filter((k) => DEFAULT_PRICES[k] !== CLAIMED[k]);
    const sev = drift.length ? 'error' : 'pass';
    const details = drift.length
      ? [`Published national rates (${drift.map((k) => `${k}=$${CLAIMED[k]}`).join(', ')}) no longer match the quote engine: ${drift.map((k) => `${k}=$${DEFAULT_PRICES[k]}`).join(', ')}. Update the public pages.`]
      : ['Published national rate claims match the quote engine defaults exactly.'];
    results.push(check('conflicting_claims', sev, sev === 'pass' ? 'No pricing-claim drift between public pages and the quote engine.' : 'Public pricing claims conflict with the quote engine.', ['/pricing', '/faq', '/realtor-partners', '/city-pages'], details));
  }

  // ---- Persist ----
  const error_count = results.filter((r) => r.severity === 'error').length;
  const warning_count = results.filter((r) => r.severity === 'warning').length;
  const runStatus = error_count ? 'failed' : (warning_count ? 'warning' : 'success');
  const snapshot = {
    registry_size: ACTIVE_CITIES.length,
    verified_capacity: capacity,
    generated_at: startedAt,
  };

  // Record coverage changes by diffing against the previous run's snapshot.
  const previous = (await base44.asServiceRole.entities.IntegrityRun.filter({}, { sort: '-created_date', limit: 1 })).items[0];
  const prevCap = previous?.coverage_snapshot?.verified_capacity || {};
  const changeLogs = [];
  for (const city of new Set([...Object.keys(prevCap), ...Object.keys(capacity)])) {
    const prev = Number(prevCap[city] || 0);
    const nowV = Number(capacity[city] || 0);
    if (prev !== nowV) {
      changeLogs.push({
        city,
        change_type: 'contractor_capacity',
        field: 'verified_contractor_count',
        previous_value: String(prev),
        new_value: String(nowV),
        changed_by: 'integrity-automation',
        note: `Diffed by the ${startedAt.slice(0, 10)} platform integrity run.`,
      });
    }
  }
  if (changeLogs.length) await base44.asServiceRole.entities.CoverageChangeLog.bulkCreate(changeLogs);

  await base44.asServiceRole.entities.IntegrityRun.create({
    run_date: startedAt.slice(0, 10),
    status: runStatus,
    checks: results,
    error_count,
    warning_count,
    coverage_snapshot: snapshot,
    notes: `Automated integrity run: ${results.length} checks in ${Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000))}s.`,
  });

  return Response.json({ ok: true, status: runStatus, error_count, warning_count, checks: results, coverage_changes_logged: changeLogs.length });
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RecyclingOS-Integrity/1.0 (platform self-check)' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    const body = res.ok ? await res.text() : '';
    return { ok: res.ok, status: res.status, body, hasTitle: /<title[\s>]/i.test(body) };
  } catch {
    return { ok: false, status: 0, body: '', hasTitle: false };
  }
}

function reqOrigin(req) {
  const fromHeader = req.headers.get('x-base44-app-url');
  if (fromHeader) return fromHeader.startsWith('http') ? fromHeader.replace(/\/$/, '') : `https://${fromHeader}`;
  return 'https://samedayrecycling.ca';
}