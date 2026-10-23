import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isTestPartner } from '../../shared/coverageStatus.ts';
import { dedupeObservations, summarizeDemand, PROVINCES } from '../../shared/demand.ts';

// Public (aggregate-only) national demand report:
//   industry = estimated Canadian search demand, from admin-verified,
//              source-labeled DemandObservation records (deduplicated).
//   capture  = Same Day Recycling's own verified performance: Search Console
//              impressions/clicks (Canada-filtered), Google Analytics
//              engagement, and verified Recycling OS inquiries/completions.
// Market share is deliberately NOT computed unless both layers are
// methodologically comparable — the note explains when it can exist.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    // ---- Industry demand (deduped observations) ----
    let rows = [];
    let cursor = undefined;
    for (let i = 0; i < 12; i++) {
      const page = await svc.entities.DemandObservation.list({ limit: 500, cursor });
      rows = rows.concat(page.items || []);
      if (!page.has_more) break;
      cursor = page.next_cursor;
    }
    const deduped = dedupeObservations(rows);
    const industry = summarizeDemand(deduped);
    // Capped raw series for the geographic explorer (aggregate data only).
    const series = deduped
      .sort((a, b) => String(b.period).localeCompare(String(a.period)))
      .slice(0, 800);

    // ---- Market capture (latest verified snapshot) ----
    const snaps = await svc.entities.DemandSnapshot.list({ sort: '-refreshed_at', limit: 1 });
    const snapshot = (snaps.items || [])[0] || null;

    // ---- Verified service coverage (operational data, not search demand) ----
    const partnerPage = await svc.entities.Partner.list({ limit: 500 });
    const partners = (partnerPage.items || []).filter((p) => p.active && !isTestPartner(p));
    const availableContractors = partners.length;
    const verifiedAreas = [...new Set(
      partners.filter((p) => p.verified).map((p) => String(p.city || '').trim()).filter(Boolean)
    )].map((city) => String(city).toLowerCase());

    return Response.json({
      industry,
      series,
      series_truncated: deduped.length > series.length,
      capture: snapshot ? {
        available: true,
        refreshed_at: snapshot.refreshed_at,
        gsc: snapshot.capture?.gsc || null,
        ga: snapshot.capture?.ga || null,
        recycling_os: snapshot.capture?.recycling_os || null,
        sources: snapshot.sources || {},
      } : {
        available: false,
        note: 'Awaiting the first verified capture sync (Search Console, Analytics and Recycling OS records).',
      },
      // Methodologically comparable-only rule: industry volume (Keyword
      // Planner estimates) and our organic clicks measure different things.
      // A share figure is only produced when a same-basis comparison exists.
      market_share: null,
      market_share_note: 'Market share is not calculated: industry search-volume estimates and Same Day Recycling organic clicks are methodologically different measures. The two intelligence layers are shown separately.',
      coverage: {
        available_contractors: availableContractors,
        verified_service_areas: verifiedAreas,
        note: 'Contractor availability is operational capacity on file — it is never implied from search demand.',
      },
      provinces: PROVINCES,
      methodology: {
        industry: 'Industry demand sums deduplicated, source-labeled search-volume observations (one per keyword + geography + period). Values from Google Ads Keyword Planner are Google estimates; trend indices are relative interest (0-100), never exact counts.',
        capture: 'Market capture uses Google Search Console (Canada-filtered, 28-day window), Google Analytics engagement, and verified Recycling OS inquiries and completed jobs. Internal test records are excluded.',
        updates: 'Search Console and Analytics refresh on their actual provider cadence (daily, with ~2 days of reporting lag). Keyword Planner and Google Trends refresh only when their data is imported or a connection is added.',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}