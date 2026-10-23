# Growth Intelligence — Architecture Audit & Phase 1 (2026-10-23)

## Phase 0 — Architecture audit (existing state)

**Entities feeding intelligence (all existing, untouched):**
- `BrandScan` — AI brand scans, verified vs AI-estimate findings, scan history.
- `Visit` — traffic with the four classifications (customer / contractor / owner / bot).
- `Booking`, `NationalRequest`, `QuoteLead`, `LeadOffer`, `Dispute`, `Review`, `ChangeOrder`, `Partner` — operations, funnel and reputation inputs.
- `FinancialTx`, `PaypalTransaction` — money records; externally paid jobs kept separate from verified platform revenue.

**Existing intelligence functions (reused, not duplicated):**
- `searchAuthority` — 100% real Google Search Console data (authorized connector); index-coverage evidence, query/page performance, ranked opportunities. Never estimates rankings.
- `conversionFunnel` — visitor → quote → booking → confirmed → revenue, with owner/bot traffic excluded and test records filtered.
- `marketOpportunity` — city classification (confirmed capacity / matching territory / recruitment) from real demand, verified partners and GSC impressions.
- `reputationEngine` — facts-only network metrics; returns null when data is insufficient, never fabricates.
- `brandScan` — reviews the rendered site via live web context; flags the non-JS crawler view separately.
- `rexIntelligence` — conversational analyst over funnel + search + market data; cited findings, ranked actions, cannot publish/spend/change settings.
- `competitorPricing`, `salesIntelligence`, `marketingIntelligence`, `contentGen`, `socialPosts` — competitor, sales and content modules for later phases.

**Connectors (authorized):** Google Search Console, Google Analytics, Google Sheets, Gmail, Google Calendar, Facebook Pages, TikTok. Google Reviews sync remains pending GOOGLE_PLACES_API_KEY (existing known issue).

**Permissions:** all intelligence surfaces are admin-only (entity RLS + function role checks). Preserved as-is.

## Phase 1 — Growth Intelligence dashboard (`/admin/growth`, admin-only)

Five gauges, all computed client-side from the live verified data above:

1. **Search Visibility** = 40% index coverage (sitemap pages with 90-day GSC impressions) + 30% CTR (8% = 100) + 30% average position (pos 5 = 100, pos 20+ = 0). Source: GSC, 28-day window.
2. **Brand Authority** = latest AI brand scanner overall score; trend = delta vs previous stored scan. Findings labelled verified / AI-estimate.
3. **Customer Reputation** = verified average rating (min. 3 approved reviews) scaled to 100; dispute and punctuality facts reported alongside, never blended.
4. **Market Opportunity** = share of tracked cities weighted: confirmed capacity 1.0, matching territory 0.5, recruitment 0.25. 100 = every tracked city has verified capacity. Unverified locations are never labelled operational.
5. **Growth Readiness** = 40% visit→quote (30% benchmark) + 40% quote→booking (30% benchmark) + 20% booking→confirmed. Real traffic only; owner/bot excluded by the funnel engine.

Each gauge expands to: methodology, live evidence with source windows, identified problems, recommended improvements. Ranked next actions combine search opportunities, market gaps, brand-scan weaknesses and reputation gaps — each with What/Why/Do/Measure and a link to the owning module.

Data policy: any gauge with insufficient data renders "Not tracked — reliable data unavailable". No fabricated metrics anywhere. Results load once per visit (manual refresh) to limit API/credit usage.

## Phase mapping (Phases 2–6)

- **Phase 2 Brand Scanner** — shipped previously (brandScan + BrandScan entity + scan history).
- **Phase 3 Rex Integration** — shipped previously (rexIntelligence, cited + approval-gated).
- **Phase 4 Market & Reputation** — partially shipped (marketOpportunity, reputationEngine, competitorPricing); deferred: cross-competitor comparisons UI and review-source aggregation beyond existing Review records (Google review sync still pending Places key).
- **Phase 5 Content & Revenue** — modules exist (contentGen, socialPosts, conversionFunnel, revenueIntelligence); deferred: connecting content workflows to campaign-attribution analytics.
- **Phase 6 White-Label** — deferred: tenant-isolated Growth Intelligence per contractor (requires tenant-scoped scanner runs and RLS on scan/reputation records by owner_email, mirroring FinancialTx).

## Scheduled automation (planned, not yet active)

Daily health checks, weekly search/market summaries, negative-review and ranking-change alerts via workflows — deferred to avoid unnecessary credit consumption until requested explicitly.