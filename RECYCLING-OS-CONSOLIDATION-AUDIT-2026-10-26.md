# Recycling OS Consolidation Audit — 2026-10-26

Purpose: establish one Recycling OS — one visual identity, one intelligence architecture,
three user experiences (Customer, Live Intelligence, Operations). No functionality was
merged, deleted or changed in this pass. Only low-risk visual corrections were applied;
everything else requires owner approval.

---

## STEP 6 FINDING — The 77-record national radar total (investigated, definitions now stated)

Verified directly against the DemandSignal entity (77 records, 30-day window):

| Record class | Count | What one record actually is |
|---|---|---|
| search_interest | 50 | One row per keyword + geography + reporting period. A row aggregates **many** searches — it is a keyword-level count, **not** an individual customer. |
| platform_inquiry | 26 | One individual customer inquiry (request/quote lead). |
| confirmed_booking | 1 | One individual completed booking. |

- All 77 `signal_key` values are unique — **no duplicates, no overlapping categories** (demand types are mutually exclusive per record).
- By source: 38 search_intelligence + 39 internal_platform.
- **Correct definition, now applied identically everywhere:** the total is "intelligence records" (unique evidence items), never "77 customers" or "77 demand events". Only `platform_inquiry` + `confirmed_booking` (27) are individual customer demand.
- The Live Intelligence feed (`liveIntelligence` gauge) already keeps demand types separate and returns `basis_note`; the homepage Live Intelligence preview copy now states this basis explicitly.
- No combined observations are labelled as individual customer demand.

## STEP 1 — Module inventory (purpose / data / users / unique functions)

| Module | Purpose | Data sources | Primary user | Unique function |
|---|---|---|---|---|
| Overview (/admin) | Network-wide command summary | Bookings, partners, finance, reviews, visits | Admin | 5-area command grid |
| Gauge Wall (/admin/gauges) | All BI metrics as gauges | Shared BI calculation layer | Admin | Full metric battery view |
| Live Operations (/admin/ops) | Realtime ops tracking | Bookings, dispatch | Admin | Live tracker tabs |
| National Ops (/admin/national) | National requests, recruitment, sales intel | NationalRequest, ProviderRecruit | Admin | Recruitment queue |
| Growth Intelligence (/admin/growth) | Growth module hub + links | GSC, keywords | Admin | Cross-links growth modules |
| Network Growth Engine (/admin/growth-engine) | Fund, campaigns, simulator, capacity | NetworkGrowthSettings, campaigns, financials | Admin | Growth-fund planning |
| Owner Command Centre (/admin/growth-command) | AI discoveries, approvals, revenue impact | growthCoordinator, GrowthDecision | Admin | Approval workflow |
| Brand & Market Intelligence (/admin/intelligence) | Brand scan, market intel, Rex monitor | BrandScan, market data | Admin | Brand scanner |
| Live Business Intelligence (/admin/bi) | Acquisition / traffic / performance tabs | Shared BI layer, visits | Admin | Tabbed BI dashboard |
| Market Intelligence (/admin/demand) | Market data tabs, import, insights | marketImport, demandTrends, keyword data | Admin | Market data import |
| Demand Observatory (/admin/observatory) | National overview, layers, queue | DemandSignal, PublicOpportunity | Admin | Intelligence layers |
| Search Authority (/admin/search-authority) | Crawl audits, index coverage, market gauges | CrawlAudit, GSC | Admin | Indexing recovery |
| SEO Action Engine (/admin/seo-action) | Recommended/applied SEO changes | SeoRecommendation, SeoChangeLog | Admin | Approval-gated SEO actions |
| SEO Command (/admin/seo, Advanced) | Older SEO runner + sitemap + city meta | autoSeo, citySeoSync | Admin | Auto-SEO runner |
| Search Intelligence (/admin/search-intelligence, Advanced) | Older keyword/query tracking | searchConsoleKeywords | Admin | Query tracker |
| Marketing Command (/admin/marketing-command) | Marketing campaign command | MarketingContribution, campaigns | Admin | Contribution program |
| Marketing Hub (/admin/marketing, Advanced) | Legacy marketing admin | mixed | Admin | Legacy tools |
| Customer Acquisition (/admin/acquisition) | Traffic/visit analytics | Visit, sessions | Admin | Acquisition panels |
| Opportunity Discovery (/admin/discovery) | Public discovery feeds | PublicOpportunity, DiscoveryRun | Admin | Discovery ingestion control |
| Public: /live, /demand, /recycling-os, /adi, /prototype*, /prototype-observatory | Public intelligence surfaces | liveIntelligence, livingSignals, observatoryFeed | Customer/public | Multiple overlapping presentations of the same feeds |

## Overlapping / duplicate modules (candidates — merge ONLY after approval)

1. **Growth cluster**: Growth Intelligence + Network Growth Engine + Owner Command Centre overlap in purpose (growth planning/approvals). Candidate: one "Growth" parent with tabs.
2. **Market cluster**: Market Intelligence + Demand Observatory + parts of Live Business Intelligence overlap (market data + observatory views). Candidate: one "Market Intelligence" parent with tabs.
3. **SEO cluster (4 modules)**: SEO Command + Search Intelligence (both legacy, in Advanced) duplicate Search Authority + SEO Action Engine. Candidate: consolidate under Search Authority; keep legacy routes as redirects.
4. **Gauge Wall vs Overview/Business Intelligence**: Gauge Wall renders the same shared BI layer as AdminBI. Candidate: keep as a view/tabs inside Business Intelligence, not a separate module.
5. **Marketing Command vs Marketing Hub**: Advanced Marketing Hub is legacy; candidate: fold into Marketing Command.
6. **Public intelligence pages**: /live (LiveCentre), /demand, /recycling-os, /adi, /prototype, /prototype-observatory present overlapping intelligence. Candidate: /live as the single Live Intelligence experience; others redirect.
7. **National Ops vs Live Operations vs Jobs & Dispatch**: related dispatch surfaces; candidate: group under one Operations parent in navigation (no route changes).

## Colour conflicts (found → corrected this pass where low-risk)

- Master family: deep forest/navy surfaces, cyan + arctic accents, **amber reserved** for warnings/pending/conversion, violet for modeled intelligence, green for verified.
- Found: 22 uses of Tailwind `bg-amber-400/500`, plus `bg-yellow-400/500` and `bg-gold` (4) — off-family yellows on Admin, Coverage, LiveCentre, observatory and consumer components. **Corrected** via a global token remap to the master amber (visual only, preserves all logic and hover states).
- `bg-emerald-500/600`, legacy hex greens and navy surfaces were already remapped by the Command 3 layer — verified working.
- One stray `bg-cyan-500` — flagged for the approval pass (map/indicator context needs review before remapping).
- Primary action colour: consumer pages use amber CTA; admin uses the bright action emerald (`--li-btn`); Live Intelligence uses cyan on dark. These are role-scoped and consistent; no change made.

## Mobile layout defects (identified; fixes require approval unless noted)

1. Admin sidebar: **already a collapsible drawer under 768px** (verified in AdminLayout) — no defect remaining inside AdminLayout routes. However, the 7 shell pages outside AdminLayout (/admin/pricing, /admin/analytics, …) have **no admin navigation at all** on mobile — flagged.
2. Floating Rex/ReceptionistChat launcher (48px, bottom-right, z-60) can overlap sticky booking CTAs on consumer pages — flagged; needs a positioning rule per page.
3. Live Intelligence header text truncation on narrow screens — flagged for the approval pass.
4. Gauge labels: city labels already truncate at >10 chars; `MetricGauge` center value scales down at ≤480px. Gauge Wall dense grids remain at risk on mobile — flagged for spacing pass.

## Components that should be shared (already extracted; remaining opportunities)

- Extracted and in use: `OSIntelligenceGauge` master family (radar geometry, light/dark appearance), `MetricGauge`, `CompositionGauge`, `DemandRing`, `TrustMetricRing`, `gaugeCore` tokens/palette.
- Remaining to extract: status-badge tones, KPI card variants (KpiCard vs StatCard are near-duplicates), the market-category label map (duplicated between admin and public), and a shared "records basis" caption component so public and admin displays always carry the identical definition note.

## Applied this pass (low-risk, visual only)

1. Master amber remap for off-family yellow/orange/gold backgrounds and accents (one CSS layer, no logic).
2. Homepage Live Intelligence preview copy now states the record basis explicitly (records ≠ individual customers; search interest is keyword-level).

## Requires owner approval before implementing

- Merging/retiring any of the overlapping modules above (with redirects for legacy routes).
- Removing the public prototype/observatory pages or /demand in favour of /live.
- Adding admin navigation to the 7 shell pages outside AdminLayout.
- Repositioning the Rex launcher vs sticky booking CTAs.
- Remapping the single `bg-cyan-500` and dense Gauge Wall mobile spacing.
- Reorganizing AdminLayout navigation into the three experience parents (Operations / Intelligence / Configuration already partially grouped).

No records, entities, routes or working integrations were deleted. No operational logic was changed.