# Recycling OS integration audit

**Recorded October 24, 2026, before repairs. Increment 1: rendering, coverage correctness and intake integrity.**

This is a source/configuration review plus an observed mobile rendering failure, not an end-to-end certification. The repository inventory contains 110 page files, 95 entity definitions, 127 backend entry points and 41 workflow definitions. Inventory does not mean every file or integration has been fully audited. Existing customer, contractor, booking, financial and historical traffic records are not being migrated, rewritten or deleted.

## Verified findings before implementation

| Priority | Finding | Evidence | Planned action |
| --- | --- | --- | --- |
| Critical | Hero 3D renderer is never inserted into the page. | HeroCanadaMap3D constructs a renderer but contains no appendChild call; deployed homepage HTML contains an empty mount. The mobile preview shows no map. | Attach the actual canvas; keep SVG visible until a successful render. |
| Critical | Legend and scene share the booking form's background, with the higher-layer form covering interactions. | InstantQuoteFlow places HeroCanadaBackground absolutely behind its full-width form. Mobile screenshot shows legend underneath Continue. | Give the existing map a dedicated responsive hero column/row, not another subsystem. |
| High | WebGL failure can leave the map blank. | A null scene or failed import never activates the SVG; fallback is gated only by a WebGL capability probe. | Default to interactive SVG, upgrade after first render, handle context loss. |
| High | Geography omits the Arctic archipelago and northern mainland border. | canadaOutline contains only three hand-drawn polygons. | Replace with attributed Natural Earth country geometry used by both renderers. |
| Critical | The service registry is represented as active matching activity. | coverageStatus adds every ACTIVE_CITIES entry to matching_cities even without a request. Coverage page describes that list as cities with real open requests. | Separate registry recruitment from actual request matching. |
| High | Provider presence is mislabeled as verified same-day pickup. | HeroMapCityTooltip's same_day label; legacy same_day key in useCoverageStatus. | Preserve compatibility key, correct its customer-facing meaning, show capacity separately. |
| High | Contractor counts can double-count multi-city operators. | Hero background sums city contractor counts, despite endpoint having distinct totals.contractors. | Reuse distinct endpoint total, never sum city counts. |
| High | Network map reads the wrong response level. | CanadaNetworkMap reads coverageStatus and activeBookingsMap fields without SDK response.data. | Consume the shared coverage hook and correct the activity response. |
| High | Geographic connections/territory boundaries are inferred. | Hero links nearest cities by proximity; national map connects directory facilities to an assumed HQ and draws 35 km circles. | Show only explicit contractor-territory relationships, not synthetic operational routes or radius claims. |
| Critical | Service Finder ignores the live coverage service. | ServiceFinder builds promises from CITIES.status, including before-noon same-day promises and static onboarding claims. | Use the same live coverage snapshot as city/coverage pages. |
| High | National marketing overstates fulfillment. | TopBar says Serving every Canadian city; DiscoveryHero says Book a verified local pickup in minutes; RequestService says same-day is guaranteed in verified territories. | State nationwide request intake and per-job contractor acceptance. |
| Critical | Homepage intake sends a province as the city. | InstantQuoteFlow submits city: provinceName(province), preventing municipality-level matching. | Collect the actual city explicitly; preserve province separately. |
| High | Item descriptions do not match deterministic quote keys. | InstantQuoteFlow sends labels such as Sofa / couch, while pricing.itemsToEighths expects sofa. French labels also do not match. | Send canonical keys to the existing engine; unsupported/general loads require the existing description-based estimate. No rate changes. |
| High | Regional pricing is omitted from homepage estimates. | InstantQuoteFlow invokes quoteEstimate with items only, without city. | Pass the actual municipality to the existing city-aware quote engine. |
| High | An inquiry is counted as a booking. | InstantQuoteFlow emits booking_submitted after nationalRequest, not a confirmed Booking. | Distinguish inquiry submission from confirmed booking; preserve historical events. |
| High | National intake and direct booking still use registry eligibility in operational logic. | nationalInquiry uses isActiveCity for verified status and can match unverified Partner records by home city only. createBooking uses isActiveCity as a direct-booking gate. | Follow-up integration must reuse verified explicit territory matching; do not silently backfill or alter historical jobs. |
| High | Rex has mutually contradictory instructions. | receptionist requires quoteEstimate but also hardcodes prices, a 10% self-load discount and automatic You're booked wording. coverageStatus is not an authorized agent tool. | Follow-up: remove unsupported promises and connect verified coverage with explicit permission; do not claim agent integration complete. |
| Medium | Booking drafts and conversations are separate. | Homepage state is component-local; ChatPanel creates a new conversation on each open; Service Finder does not transfer item details. | Follow-up shared, privacy-conscious draft and contextual assistance; no competing booking database. |
| High | Automatic audit buttons are not guaranteed read-only. | AdminIntegrity.runNow receives click events through onClick={runNow}, and has repair-capable full_audit actions. | Correct click handler; do not run repair-capable audits as verification. |

## Existing systems to reuse

- **Coverage:** Partner, explicit service_cities, territory capacity helpers, coverageStatus and useCoverageStatus. Provider/RecyclingCenter are facility directories, not pickup contractor records.
- **Pricing:** PricingSettings, resolveCityPrices, quoteEstimate and cityPricing. Current defaults in the shared engine are CAD 139 / 189 / 269 / 419 / 549 / 649. A reviewed Port Coquitlam configuration matches those defaults. This is not proof every city or marketing page is consistent. No price changes are authorized or performed in this increment.
- **Customer operations:** NationalRequest, Booking, QuoteLead, TrackingEvent, DispatchTask, LeadOffer, ChangeOrder. Preserve distinction between request, assignment, acceptance, completed work and approved payment.
- **Market intelligence:** DemandObservation, DemandSnapshot, DemandInsight, PublicOpportunity and observatoryFeed. No new opportunity records. At this review there are zero open PublicOpportunity records; an empty feed is not zero Canadian demand.
- **Analytics:** Visit, sid, traffic_class and shared trafficIntel reporting. Read-only all-time grouping returned customer 2,401, bot 145, owner 353 and contractor 2; these are stored record classifications, not independently verified genuine visitors. No historical reclassification.
- **Payments and notifications:** Existing PayPal, email, Calendar and Sheets functions/workflows. Connected or configured does not establish successful delivery or capture. No transactions, real dispatches or test messages are initiated.

## Further audit and owner decisions

1. Pricing: inspect every regional configuration, published example, heavy-item policy, discount, Rex claim and final-approval path. Resolve differences only with owner approval; canonical item mapping is an estimate-calculation correction, not a price-table change.
2. Operational correctness: unify nationalInquiry/createBooking/dispatch eligibility before certifying nationwide fulfillment. Preserve customer requests even without capacity.
3. Rex and cross-page journey: retain drafts and conversation context, authorize a safe coverage lookup and reconcile unsupported pricing/guarantee language.
4. Market Pulse: review attribution, relative Trends indices vs absolute volumes, reporting windows, source freshness and public discovery provenance across the existing observatory. No new data source is declared live by this audit.
5. Reviews and trust: all public testimonials, guarantees, statistics and directory verification need a complete evidence audit. No reviews are created or edited.
6. Workflows/integrations: the configuration inventory is reviewed, but execution histories, external grants, payment capture, notification delivery, partner provisioning, software tenant isolation and all schedules are not certified. No schedules are changed.
7. Accessibility/performance: targeted map readability/keyboard/reduced-motion repairs first; exhaustive assistive-technology, SEO and field performance assessment remains outstanding.

## Safe end-to-end verification handoff

Use the Testing Agent with test data and external side effects disabled. No scenario below has been executed by this report.

| Scenario | Required assertion | Status |
| --- | --- | --- |
| A | Verified territory is recognized, with no appointment promise before acceptance. | Not run |
| B | Matching/recruitment is shown honestly; requests persist without inventing capacity. | Not run |
| C | Additional items require separate approval; declined additions are never charged. | Not run |
| D | Rex returns the existing quote engine's region-specific estimate and no invented slot. | Not run |
| E | SVG renders, 3D upgrades when supported, node/region selection and postal focus work. | Not run |
| F | A sandbox request becomes a booking only at the correct confirmation stage. | Not run |
| G | Only an eligible verified territory contractor receives a sandbox offer. | Not run |
| H | Analytics distinguish visits, inquiries, confirmed jobs and verified money. | Not run |

No real payments, job offers or production bookings should be generated for this verification. Deployed 3D rendering is **not verified**; a successful build alone cannot establish it.

## Increment 1 completion report

### Repairs applied

- Attached the 3D canvas to its actual container. Moved the existing network out from behind the booking form into its own responsive area inside the same hero. The form stays first on mobile and does not wait for 3D loading.
- The interactive SVG is the initial map; 3D replaces it only after initialization and an initial rendering call. Null initialization, import errors and WebGL context loss leave the SVG available. Both maps use the same attributed Natural Earth country geometry, including Arctic islands.
- Added readable opaque panels, municipal and provincial selectors, keyboard-operable SVG nodes, a white selection ring, city detail panels, source definitions and province-level postal focus. The map explicitly states that focus is not precise postal geocoding and municipalities are not service radii.
- Removed proximity-created hero links, assumed HQ links, moving data pulses and the national map's invented 35 km coverage circles. Shared-territory lines now require an actual explicit multi-city contractor record. With no such record, no lines are invented.
- The public coverage endpoint now separates actual open-request matching from registry recruitment and returns aggregate capacity without contractor names. The existing shared hook exposes distinct totals, capacity and explicit territory relationships; its data references are stable across pointer interactions.
- Homepage map, Service Finder, the request-service form, city pages and coverage views now consume the same live coverage hook. Corrected the touched nationwide/same-day claims and added the unavailable state to the coverage page. This is not a claim that every marketing or booking surface has been audited.
- Corrected the national map's SDK response handling and distinguished independently listed directory facilities from pickup contractors. Its activity measure is labeled open booking records within the latest 100 records, not active work, a complete national count or proof of genuine customers. Unavailable sources are not displayed as verified zeroes.
- Homepage intake now collects the actual municipality, validates known municipality/province disagreement, retains the selected NT/NU territory, passes city and canonical item identifiers to the existing quote engine, and uses its description-based estimate for general loads. The canonicalization does not introduce a new rate table, heavy-item charge or discount.
- Selecting a map city transfers it to the existing homepage form. This is a local handoff, not the full requested cross-page draft system.
- An instant national inquiry emits national_request_submitted instead of falsely emitting booking_submitted. Historical analytics are untouched; other event-emission sites and conversion reporting still need reconciliation.
- Request confirmation links prefill the existing tracking lookup. Tracking no longer treats the presence of a contractor name as evidence that the contractor accepted the job; it requires the recorded assignment/dispatch acceptance state.
- Corrected the integrity-check button's accidental click-event-as-full-audit argument and duplicate check-result ordering. No repair-capable integrity run was invoked.

### Existing systems reused and sources connected

Partner, NationalRequest, PublicOpportunity, Provider, the coverageStatus endpoint, useCoverageStatus, explicit territory helpers, quoteEstimate, existing pricing configuration, activeBookingsMap and requestLookup were reused. No competing entities, booking database, payment integration, workflow or AI agent were created. The hero uses aggregate PublicOpportunity counts rather than calculating totals from a truncated list. Natural Earth provides static geographic boundaries, not service or demand evidence.

### New components and supporting files

HeroNetworkHeader, HeroNetworkScene, HeroNetworkSelection, HeroMapCityStats and PickupCoverageNotice split the oversized hero into focused displays. useHeroNetwork and coveragePresentation share existing data and status language. canadaGeography.json is attributed, public-domain geographic data. IntegrationAuditReport and AuditReportBody present this report in the existing Platform Integrity screen and provide a Markdown download.

### Checks completed and results

| Check | Actual result | What it does not prove |
| --- | --- | --- |
| Read-only coverageStatus invocation | HTTP 200; 1 verified contractor covering North Vancouver, 0 contractors recording same-day capability, 0 actual matching municipalities; remaining registry municipalities returned as recruitment. | No contractor accepted a test job; no appointment or delivery was tested. |
| Targeted lint of modified/new frontend modules | Exit 0, no errors. | No browser interaction, network authorization or accessibility certification. |
| Production build command | Exit 0. | Not publication, deployed-browser visibility or end-to-end operational success. |
| Initial mobile symptom inspection | Blank hero map and overlapping legend observed before repair; empty mount found in fetched live homepage HTML. | No after-repair deployed screenshot or live rendering confirmation. |

The initial lint check found eight unused-import errors and one unused-helper warning; these were corrected and the subsequent targeted lint returned exit 0. The build reported an outdated browser-support database warning; no package update was performed. No scenario A–H was run or marked passed. No failed payment, dispatch or notification test was performed, because no such side-effecting test was attempted.

### Remaining limitations and next increment

- **Critical next:** nationalInquiry and createBooking still contain registry-based operational eligibility. Their future-record classification and dispatch behavior need to be unified with verified explicit territories before the complete booking journey can be certified. Existing job records were deliberately not backfilled.
- Rex instructions, live coverage permission, shared cross-page drafts, conversation persistence, canonical service handoffs and consistent final booking confirmation are not completed in this increment. The map supplies only an optional contextual question, not verified new agent powers.
- AI regional findings are deliberately not plotted or presented as connected yet. Market Pulse/Observatory, relative-interest datasets, local guidance, public opportunity freshness and source-level reliability need their own review. No artificial activity, reviews or demand were generated.
- Full regional pricing, heavy items, contractor-marketing prices, the unsupported Rex self-load discount and approval/payment reconciliation remain under audit. **No pricing configuration was changed.** Owner approval is required before any change to published rates or commercial policies.
- Integration grants, all scheduled execution histories, actual notification delivery, partner provisioning, software tenancy, financial reconciliation, legacy traffic confidence and all remaining public claims still require review. Configuration presence is not integration verification.
- Active-booking public data still comes from the existing limited feed. Its classification and test-record exclusion require a separate data-quality review before making genuine-customer or operational-volume claims.
- Reduced-motion handling, an offscreen GPU-render guard and a mobile frame cap were implemented for the hero, but no measured speed improvement, field performance score or complete accessibility result is claimed. The older optional network board still requires a separate performance/WebGL-fallback review.
- **Live map completion is withheld.** The rendering path is repaired in the current app changes; publication state and actual deployed-browser rendering have not been verified here.

### Safe verification instructions

Open **More actions → Testing agent**. Start with: “Check homepage map visibility, SVG fallback, keyboard/city selection and transfer of the selected city into the pickup form without submitting a request or triggering any external action.” Before scenarios A–H that create records or exercise payment/dispatch, establish an isolated test environment and disable real outbound actions; those protections are not assumed to exist. Do not run production checkout, notifications, recruitment or job-offer creation as a test.