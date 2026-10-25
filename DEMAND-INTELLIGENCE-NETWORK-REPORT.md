# Canadian Demand Intelligence Network — Implementation Report

Date: 2026-10-25 · System: Recycling OS · Status: Phases 1–6 complete, Phase 7 (Rex) connected, Phase 8 partially automated

## Completed features

**Phase 1 — Audit.** Existing demand layers inventoried before building: DemandObservation (610 search-intelligence records), PublicOpportunity (public discovery, currently empty pending Reddit credentials), ServiceQuery (38), QuoteLead (0), Booking (12 service records), observatoryFeed, searchAuthority, marketOpportunity, demandReport, rexIntelligence, Market Pulse (/demand), 2D demand map with layer toggles, Network Growth Engine.

**Phase 2 — Unified DemandSignal engine.**
- `DemandSignal` entity: source platform/type, source URL + ref, source publication vs collection vs verification timestamps, service category, eight-market taxonomy (multi-membership), demand type, geo + confidence, commercial intent, urgency, language, explainable score + factor breakdown, source reliability, keywords, contractor coverage status, recommended action, processing/review status, related-signal refs, metric context. No personal information stored; public posters are never identified or located beyond municipality.
- `demandSignalEngine` function: actions `run` (ingest), `feed`, `review`, `settings`. First verified run: 59 signals created (32 search interest, 26 platform inquiries, 1 confirmed booking), 380 stale search periods skipped honestly, 2 cancelled bookings excluded, 23 queued for review.

**Phase 3 — Existing sources connected (no duplicates).** Ingestion reads the existing records directly: PublicOpportunity (observed public requests), DemandObservation (search interest), ServiceQuery (search_console → search interest; web/receptionist → platform inquiry), QuoteLead, Booking (confirmed/scheduled/completed → confirmed booking; internal_test and cancelled excluded).

**Phase 4 — Classification, dedup, geo confidence, source validation.**
- Deterministic EN/FR keyword classification (`demandTaxonomy`) into the 8 core markets; one signal can carry several; natural-language need expressions recognized ("apartment emptied before Friday" → moving + clearance + urgent).
- Six distinct demand types, never merged into one count.
- Dedup via stable `signal_key`; related-signal linking (same city + market within configurable window) with duplicate penalty in scoring.
- Geo confidence: exact_city / province / unresolved — unresolved signals stay unresolved and are excluded from geographic counts.
- Stale public requests expire; settings history is an auditable log.

**Phase 5 — Observatory + map layers.** New admin page **Canadian Demand Observatory** (/admin/observatory): National Overview (per-type KPIs with basis labels, market chips, top municipalities, recent findings, honesty panel), Intelligence Layers (six layers A–F with distinct colors and stated measurement basis: Search Demand, Public Requests, Service Categories, Contractor Coverage, Commercial Opportunities, Network Performance; city drill-down with sources and timestamps), Opportunity Queue, Sources & Scoring.

**Phase 6 — Explainable opportunity scoring + contractor connection.** Weighted factors (relevance, evidence, geo, recency, intent, urgency, capacity + duplicate penalty), owner-configurable weights and queue threshold, per-signal factor breakdown and written explanation. Qualified/dismissed review decisions are recorded (reviewer, date, note). No automatic outreach; no bookings from third-party posts.

**Phase 7 — Rex + Growth Engine.** rexIntelligence now ingests DemandSignal aggregates (by type, by market, top cities, coverage gaps, source health) so Rex can answer where demand is, where coverage is missing, and what deserves SEO/recruitment — citing sources and labeling recommendations. Growth-engine inputs remain owner-authorized; scoring weights feed campaign planning only.

**Automation.** "Demand Signal Sync Daily" workflow runs the pipeline every morning at 7:00 America/Vancouver.

## Verified live data sources
- Recycling OS internal records (bookings, quote leads, service queries) — live.
- Search-intelligence datasets (DemandObservation, 610 records; GSC via existing Search Authority) — live with period labels.

## Sources awaiting credentials
- Reddit discovery (PublicOpportunity currently 0 records) — awaiting REDDIT_CLIENT_ID/SECRET/USERNAME/PASSWORD; pipeline ingests automatically when discovery runs produce records.
- Google Trends API — unsupported (aggressive bot detection); only source-reported exports accepted.
- Keyword Planner / historical search data — pending credentials (existing known gap).

## Data quality limitations (stated honestly in UI)
- Search interest is aggregate — never displayed as absolute counts or leads.
- 380 of 610 search observations are outside their reporting window and are excluded, not summarized.
- Location-unresolved signals (35 of 59 today) are excluded from maps, never guessed.
- Public posters' exact locations and identities are never stored.

## Remaining development work
- Reporting emails: Daily Demand Brief, Weekly Canadian Market Report, Monthly Growth Review (templates + scheduled workflows).
- Market-indicator ingestion (municipal recycling programs, housing indicators) — no authorized source connected yet.
- 3D globe layer treatment (current layers ship on the Observatory's interactive Canadian map; the home 3D globe stays consumer-simple by design).
- Network Growth Engine automation that consumes scores in campaign proposals (weights already flow into settings).