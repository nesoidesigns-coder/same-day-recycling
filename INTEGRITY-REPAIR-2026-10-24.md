# Platform Integrity Repair — Change Report (2026-10-24)

Scope: public-facing platform audit and repair. No existing bookings, contractor records, payments or integrations were modified. Live payment transactions were never read or altered.

## 1. Single source of truth — verified, gaps closed

The coverage model already runs on four separated layers (service territory, live contractor capacity from verified partner records, facility directory, per-job booking confirmation) with the shared `coverageStatus` endpoint and the `useCoverageStatus()` hook feeding the homepage, coverage map, city pages and booking gate. Hardcoded coverage counters were audited across all public pages: none remain — city counts are derived live from verified partner records.

- **Verified:** 30 registry cities consistent, capacity from 1 active verified partner (1 test/simulation partner correctly excluded).
- **Change recording:** new `CoverageChangeLog` entity — every coverage change is recorded with timestamp, previous value, new value and responsible actor. The integrity engine diffs each run against the previous capacity snapshot and logs changes; the log is visible in Admin → Platform Integrity.
- **Matching vs availability:** explicitly separated everywhere — a city with matching activity but no verified partner shows "Recruitment Open" / "Provider Matching" and never implies contractor availability. Confirmed by the `booking_availability` check.

## 2. Pricing synchronization — repaired

- **CityPage (every city page):** previously displayed national fallback rates ($139/…) immediately, before local rates loaded — a national substitute for local pricing. Now:
  - A clear loading state ("Loading current {city} rates…") is shown while resolving.
  - Prices render only after the city-specific `cityPricing` record resolves.
  - If pricing cannot be retrieved, an honest availability message is displayed instead of any price.
  - The hero "Upfront pricing from $X" line renders only when local rates are loaded.
  - The city FAQ no longer hardcodes a rate figure.
- **Quote engine:** `quoteEstimate`, `cityPricing`, booking, checkout and Rex share one merge rule (`resolveCityPrices` in `base44/shared/pricing.ts`) — only positive stored rates override defaults, so consumers can never disagree.
- **RealtorOnePager:** flat-rate table showed different rates ($149/$199/$289/$439/$579/$679) than the platform's national standard ($139/$189/$269/$419/$549/$649). Aligned to the national standard rates, relabelled "Starting rate", and the footnote now states your quote always shows your city's exact rate.

## 3. Trust and verification — verified, no fabrication

- Review displays on city pages and the provider directory render only approved `Review` entity records with star ratings from stored data — no aggregate star claims exist without backing.
- The homepage trust section already shows only data-backed metrics (verified-listing share, approved-review average) and explicitly marks response time, diversion rate and quote-completion as "Not yet tracked" with a "pending data" ring — kept as-is, it's the correct honest pattern.
- New `review_verification` check validates every approved review (rating 1–5 range, customer name, review text) on each integrity run.

## 4. Commercial consistency — repaired

- **Contractor territory wording:** "Your territory, owned" heading removed (conflicted with the page's own terms that territories are membership seats, not exclusive rights); the pricing FAQ now states "You set your own rates above the network floor… Territories are membership seats in a shared market, not exclusive rights." The page's plain-terms section already disclosed non-exclusivity and was preserved.
- **Subscription pickup limits:** already defined identically in both places — $299/month covers up to 4 pickups; extra pickups at standard tier rates, quoted and approved before each pickup; unused pickups don't roll over (Subscriptions page and RealtorOnePager property-manager plan agree).
- **Free metal page title:** meta title/description now carry the eligibility qualifier ("Free Scrap Metal Pickup — Eligibility Check") matching the page body, which already discloses that charges may apply outside confirmed service areas.
- **Final quote approval:** booking flow states "Your approved quote is the price you pay" with change-order-only additions — consistent across the quote calculator, booking form, service pages and FAQ.

## 5. Continuous integrity monitoring — new

- **New dashboard: Admin → Platform Integrity (`/admin/integrity`)** with the nine automated checks:
  1. Coverage consistency — registry vs verified partner capacity
  2. Pricing consistency — duplicate rows, invalid tiers, out-of-registry pricing rows, local-rate coverage
  3. Booking availability — booking gate matches live capacity; no implied availability
  4. Contractor status — complete records, test partners excluded
  5. Payment integration health — credentials presence, mode, recent transaction/webhook activity (read-only, never modifies transactions)
  6. Review verification — approved reviews validate
  7. Page rendering — key public pages fetched live, must return 200 with a title
  8. Broken links — sitemap URLs sampled and fetched live
  9. Conflicting claims — published national rate claims vs the quote engine's defaults
- Each check records severity (pass / info / warning / error), a summary, affected pages and verified details — findings only, never estimates.
- **New daily schedule:** "Platform Integrity Sweep" workflow runs all checks daily at 6:00 AM Vancouver time.
- **Storage:** `IntegrityRun` entity persists every run; `CoverageChangeLog` records coverage diffs.

## 6. Safe deployment

- All changes are additive or copy corrections; no booking, payment, dispatch or contractor logic was altered.
- `platformIntegrity` is admin-gated (401/403), rate-safe, read-only toward payments, and never fabricates results.
- Build verified (production build passes); first live integrity run executed successfully: **1 warning** — a Port Coquitlam pricing row exists outside the service-territory registry (a real, verified finding now visible in the dashboard for the owner to resolve in Admin → Pricing).

## First-run findings (verified, actionable)

| Check | Severity | Finding |
|---|---|---|
| Pricing consistency | Warning | Pricing row for Port Coquitlam is outside the service-territory registry |
| Page rendering / links / claims / reviews / payments | Pass | No errors |

## Deferred (recommended next)

- Add explicit `CoverageChangeLog` entries at the exact moment an admin verifies or deactivates a partner (currently diff-detected daily).
- Extend the broken-links check to internal link targets in page body copy.
- Surface integrity status in the weekly owner digest email.