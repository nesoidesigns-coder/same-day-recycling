# Single Source of Truth Audit — 2026-10-23

Platform-wide consistency audit across Same Day Recycling. Scope: coverage, pricing,
subscriptions, contractor agreements, directory, and automated regression checks.
No interface redesign, no new features — data integrity and consistency only.

## 1. Coverage synchronization — PASS after fixes

**Authoritative sources established:**
- Registry (what accepts requests): `src/lib/coverage.js` COVERAGE (30 cities) mirrored
  server-side by `base44/shared/coverageStatus.ts` ACTIVE_CITIES.
- Capacity (who can actually fulfill): LIVE verified `Partner` records, loaded through
  the `coverageStatus` endpoint — never hardcoded, never derived from facility counts.
- Matching: registry cities without verified capacity ("Requests Open — Contractor Matching").
- Recruitment: cities outside the registry.
- Per-job confirmation: `dispatch_status` on each Booking/NationalRequest ("Booking Confirmed"
  only when a specific contractor accepted a specific job).

**FAIL → FIXED — homepage reported zero matching cities**
- Data source responsible: `base44/functions/coverageStatus/entry.ts` derived
  `matching_cities` ONLY from open `NationalRequest` records. With no open requests the
  homepage reported 0 matching while the registry showed 29 cities as requests-open.
- Fix: matching now derives from the registry minus verified-capacity cities (open
  out-of-registry requests still appended). Verified output: verified=[North Vancouver],
  matching=29 registry cities.
- **FAIL → FIXED — internal test records polluted public coverage**: open validation
  fixtures (FPTEST1 Vancouver, 69CA0D70 Kelowna) were counted as public matching demand.
  Data source: `NationalRequest` had no record_type. Fix: added `record_type`
  (service/internal_test), marked fixtures internal_test + cancelled them, and the
  endpoint excludes internal_test records from public counts.
- **FAIL → FIXED — registry mirror drift**: server `ACTIVE_CITIES` was missing
  "North Vancouver" (the ONLY city with verified capacity). Added. Automated parity check:
  server 30 = registry 30, zero drift — PASS.
- **FAIL → FIXED — overpermissive booking gate**: `isActiveCity` used loose substring
  matching, so "West Vancouver" resolved to "Vancouver" and could book directly. Data
  source: `isActiveCity` in `base44/shared/coverageStatus.ts`. Fix: exact-match against
  the registry (province suffixes normalized). Verified: West Vancouver → 422
  service_not_available; no record created.
- **PASS** — label discipline: "Provider Available" (same_day) is only ever set from the
  live verified-capacity set (`cityServiceProfile` returns bookingEligible=false without
  it); facility directory counts never imply pickup capacity.
- **PASS** — Rex AI synchronized: receptionist instructions no longer claim a "nationwide
  partner network covering every province and territory"; now state requests are accepted
  nationwide with verified same-day capacity confirmed live by city.

## 2. Pricing stability — PASS after fixes

**Authoritative source:** `PricingSettings` records (city overrides) over
`DEFAULT_PRICES` in `base44/shared/pricing.ts`, resolved by ONE shared helper.

- **FAIL → FIXED — two different merge rules produced different prices.** Data source:
  `base44/functions/quoteEstimate/entry.ts` spread the whole record
  (`{...DEFAULT_PRICES, ...rows[0]}`), letting zero/unset tiers override defaults with $0
  and non-price fields into the rate set, while `cityPricing` only accepted positive
  values. Fix: single `resolveCityPrices()` helper in `base44/shared/pricing.ts`, used by
  both functions. Verified: Vancouver sofa+fridge quote = $289–$350 from BOTH the quote
  engine and `cityPricing` — identical.
- **FAIL → FIXED — no version history, no approval record.** Data source:
  `PricingSettings` schema had no change history. Fix: added `revision`, `approved_by`,
  `approved_date`, and immutable `history` snapshots; the admin pricing editor now
  snapshots the previously published rates into history on every save and records who
  approved it and when. Every published change requires an explicit owner action.
- **PASS — no automatic overwriting found**: the only writer of PricingSettings is the
  admin editor (RLS: admin-only). No sync job writes national defaults over city rows;
  history now makes any future overwrite detectable.
- **FAIL → FIXED — Vancouver audit + display drift**: approved Vancouver rates are
  $149/$199/$289/$439/$579/$679 (no change history existed before this fix — now
  versioned going forward). The Realtor one-pager showed $299 (matches NEITHER Vancouver
  nor national) and $549/$419/$139/$189/$649 (national, not Vancouver). Data source:
  hardcoded table in `src/pages/RealtorOnePager.jsx`. Fix: aligned all six rows to the
  approved Vancouver rates the quote engine actually returns.
- **PASS — Rex quotes only from the quoteEstimate tool**; its hardcoded "$139 minimum /
  $649 full truck" narrative now defers to city-set figures from the tool.
- **PASS — hedged national-rate copy**: FAQ, Pricing page and furniture page now state
  national rates as the standard with city-specific approved rates shown in quotes
  (CityPage already fetched live city rates).
- Note (data, left in place): a `Port Coquitlam` pricing row exists for a city outside
  the registry — harmless (pricing reads any city), flagged for owner review.

## 3. Subscription consistency — PASS

- **PASS** — $299/month identical on all five surfaces (Subscriptions page, realtor
  landing, realtor one-pager, SubSignup, SubTeaser) and in Rex's pitch instructions.
- **PASS** — terms defined: up to 4 pickups/month, extra pickups quoted and approved at
  standard tier rates before each pickup, unused pickups don't roll over.
- **PASS** — no entitlement changes without owner action: subscription signup only
  creates a `Subscription` record; activation/billing is manual, and no code path
  changes entitlements automatically.

## 4. Contractor agreement consistency — PASS

- **PASS** — no exclusivity claims anywhere: Contractors page and PartnerAgreement
  explicitly state "territories are membership seats, not exclusive rights" and "no
  guaranteed exclusivity"; territory pages stay on the platform domain.
- **PASS** — customer-source distinction preserved in the data model:
  `customer_origin_source` (set once, never rewritten) vs `job_source` (per job) on
  Booking; fee rules apply by source (`applies_to_sources` on ContractorAgreement).
- **PASS** — fee disclosure before acceptance: fees are disclosed in writing before
  acceptance (Contractors page), snapshotted into `fee_terms_snapshot` at assignment and
  computed by the fee engine before any job offer is acted on.
- **PASS** — signed obligations preserved: existing agreements untouched by this audit.

## 5. Directory integrity — PASS after fixes

- **FAIL → FIXED — 3 duplicate facility pairs** (United Boulevard Recycling and Waste
  Centre Coquitlam, Vancouver Zero Waste Centre, Vancouver South Transfer Station).
  Data source: duplicate `RecyclingCenter` records from overlapping research syncs. Fix:
  merged complementary accepts lists and evidence notes into the authoritative record
  (official Metro Vancouver / City of Vancouver sources kept), deleted the duplicates.
  Verified: 166 facilities, 0 duplicates remaining.
- **FAIL → FIXED — unsupported "verified" label**: homepage map copy called directory
  facilities "verified for our public directory" while records carry only
  `researched_date` (no verification field exists). Data source: CanadaNetworkMap copy.
  Fix: wording now "researched for our public directory", and pickup-partner distinction
  is stated in the same sentence.
- **PASS** — verified/unverified separation: the facility directory makes no verified
  claims; contractor capacity is only ever asserted from live verified `Partner` records.

## 6. Automated regression checks — results

| Check | Result | Data source verified |
|---|---|---|
| Server registry ↔ frontend registry parity | **PASS** | ACTIVE_CITIES ↔ COVERAGE — 30/30, zero drift |
| Homepage ↔ coverage endpoint | **PASS** | coverageStatus now returns 29 matching from the registry (was request-count-derived, showed 0) |
| Coverage ↔ booking gate | **PASS** | createBooking 422 for West Vancouver (exact-match gate); registry cities accept |
| Quote engine ↔ pricing endpoint | **PASS** | quoteEstimate + cityPricing both return Vancouver $289 1/4-truck via shared resolveCityPrices |
| Rex ↔ pricing | **PASS** | quoteEstimate tool is the only price source; hardcoded narrative removed |
| Price displays ↔ engine | **PASS** | Realtor table aligned to approved Vancouver rates; national-rate copy hedged |
| Subscriptions ↔ payment | **PASS** | $299 consistent on 5 surfaces; signup creates records only, no auto-entitlement |
| Contractor terms ↔ onboarding | **PASS** | Non-exclusivity explicit; fee disclosure + snapshot before acceptance |
| Directory duplicates | **PASS** | 0 remaining (was 3 pairs); evidence merged and preserved |
| Test-data pollution | **PASS** | internal_test records excluded from public coverage counts |

## Residual notes for the owner (no action taken without approval)
1. `Port Coquitlam` pricing row exists outside the service registry — review or remove.
2. Vancouver rates are now versioned; no pre-fix change history exists (none was stored).
3. The subscription is not charged online (signup creates a record; activation is
   manual) — deliberate, unchanged.