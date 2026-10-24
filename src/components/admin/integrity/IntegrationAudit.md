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