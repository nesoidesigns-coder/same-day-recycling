# National Operations Consistency Audit — 2026-10-23

Scope: availability centralization, pricing, subscription terms, contractor network,
trust/reporting, technical quality, end-to-end chain. No real charges or customer
bookings were made; all tests were sandbox/read-only.

## 1. Centralized availability — PASS (after audit)
- Single authoritative engine: `coverageStatus` endpoint backed by the live
  Partner registry (active + verified, test partners excluded). Verified today:
  verified = North Vancouver (1 contractor), matching = Kelowna.
- Four distinct states are consistently labelled on every public surface:
  Provider Available / Requests Open — Contractor Matching / Provider
  Recruitment / Booking Confirmed (per job, never per city).
- Booking confirmation is per-job only; no surface represents an unaccepted
  job as a confirmed appointment. Nationwide request intake preserved
  (registry of 30 cities + all of Canada).
- FIX APPLIED: none required — already centralized.

## 2. Standardized pricing — PASS (verified + 1 fix)
- National base rate card: pricing.ts DEFAULT_PRICES (139/189/269/419/549/649).
- Local overrides in PricingSettings (9 BC cities + Vancouver). Vancouver
  override verified live: 149 / 199 / 289 / 439 / 579 / 679 — cityPricing and
  quoteEstimate both return it (test quote: sofa + fridge → $289–$350, 1/4 truck).
- ONE calculation service: quoteEstimate (shared/pricing.ts) is used by the
  website calculator, Rex, and booking quotes; payment and receipts derive from
  the booking's stored figures, never re-priced.
- Taxes/discounts/approval messaging consistent: estimates only, final price
  approved on arrival before any lift; discounts never stack.
- FIX APPLIED: payment links now use the customer-approved amount
  (approved_quote_amount) when one is recorded, instead of the preliminary
  estimate — no charge can exceed what the customer approved.
- NOTE (no change): PricingSettings contains a "Port Coquitlam" row but Port
  Coquitlam is not in the 30-city registry — unused config, harmless; delete or
  register the city in Admin > Pricing.

## 3. Subscription terms — FAIL → FIXED
- Contradiction found: the signup form said extra pickups "billed at member
  rates"; the plan page said "standard tier rates". Standardized to standard
  tier rates, quoted and approved before each pickup.
- Unused-visit rule was undefined; now stated explicitly on both surfaces:
  unused pickups do not roll over between months.
- Economics validated: $299/month cannot include 4 full-truck loads (one full
  truck retails at $649). The plan's honest limit is up to 4 pickups per
  month at minimum-to-1/4-truck sizes; larger loads are quoted separately at
  standard rates. Copy now leaves pricing decisions to the per-pickup quote
  instead of implying unlimited load sizes.
- Cancellation/minimum term: "No contract — cancel anytime" appears
  consistently (plan page, signup form, Rex instructions). No minimum term
  claims exist anywhere. Consistent — PASS.
- Rex instructions updated with the same terms.

## 4. Contractor network — FAIL → FIXED
- Contradiction found: the partner-agreement page claimed "Exclusivity is
  metro, not a city line — one partner serves it," contradicting the
  Contractors page ("territories are membership seats in a shared market, not
  exclusive rights") and the operating standard (never guarantee exclusive
  territories). Agreement copy now states membership seats, never exclusivity.
- Customer ownership: consistent everywhere — network-generated customers stay
  with the network; contractor's own customers are always the contractor's.
- Revenue separation: ContractorAgreement supports commission (percentage or
  fixed, platform-generated sources only) and separate flat-fee territory
  subscriptions; membership fees never touch job revenue. Booking records
  separate commission_earned from job_value and contractor_net_amount. PASS.
- Recruitment in all territories preserved: intake open nationwide; dispatch
  recruiting unaffected. PASS.

## 5. Trust and reporting — FAIL → FIXED
- Facilities vs contractors: properly separated layers — Provider entity is
  the independent facility directory (drop-off ≠ pickup capacity) and is
  never counted as contractor capacity by the coverage engine. PASS.
- Directory scope was wrong: the page claimed "Verified Listings in British
  Columbia" while the directory actually covers 18 cities nationwide.
  Copy updated to national scope; grammar error fixed.
- Reviews: displayed reviews are admin-approved customer submissions, but the
  badge claimed "Verified customer" — overstated. Changed to "Customer review".
- National statistics: RecyclingFact records carry source_name, source_url and
  verified_date; government sources cited with reporting years. PASS.
- Insurance/legal: Contractors page discloses no guaranteed earnings or
  exclusivity; license agreement is non-exclusive. PASS after the fix in item 4.

## 6. Technical quality — PARTIAL → FIXED (2 known items remain platform-level)
- FIXED: "Recycling Centres" → "Recycling Centers" (page title) — terminology
  now "Centers" everywhere (nav, footer, entity, page).
- FIXED: services-page loading flicker — the live count in the coverage legend
  popped in from "(checking…)" to a number; the placeholder is now stable.
- Server-rendered titles/descriptions for inner pages: platform serves only a
  JS shell for most routes; the built-in control is Dashboard → SEO & GEO →
  Meta tags (per-page entries), plus a republish to refresh the stale home
  head. Not a code change — flagged for dashboard action.
- Spacing/navigation: no defects found at mobile width in the shared
  navigation; global overflow safeguards already in index.css.
- 30 city pages verified against the same data: every page renders from the
  single COVERAGE registry + live coverage status; all sitemap city URLs
  return 200 (including /junk-removal-north-vancouver, the 30th city).

## 7. End-to-end chain — validated per stage (sandbox/no-cost stages)
| Stage | Method | Result |
|---|---|---|
| Customer request | Intake open nationwide (registry + national request form) | PASS |
| Rex quote | quoteEstimate live test (Vancouver override applied) | PASS |
| Provider matching | coverageStatus live test (verified/matching lists) | PASS |
| Contractor acceptance | partnerPortal transitions enforce ownership + valid states | PASS (code) |
| Final price approval | changeOrder flow: original-quote approval + token-gated change orders | PASS (code) |
| Payment authorization | payment links now bound to approved_quote_amount; capture happens only on customer-completed PayPal approval | PASS (code) |
| Payment capture | PayPal order/capture flow with transaction ledger; PAYPAL_MODE secret set — sandbox test run recommended in the Testing Agent before next publish | RECOMMENDED |
| Receipt generation | recyclingReceipt/rexSales: completed bookings only, PDF emailed | PASS (code) |
| Contractor payout | payout fields + AdminPayouts/PaidModal records net = job_value − platform fee | PASS (code) |
| Review verification | Review entity stores submissions; admin approval gate before display | PASS |

No payment, booking, or review records were created during this audit.

## Changes applied (live after the next publish)
1. Payment links charge the approved amount, never the preliminary estimate.
2. Partner agreement page: membership seats, never exclusive territories.
3. Subscription plan: standard-rate extra pickups, no rollover — consistent on
   the plan page, signup form and in Rex.
4. Recycling Directory: national scope copy, corrected affiliation wording.
5. "Centres" → "Centers" in the recycling-centers page title.
6. Review badge: "Customer review" instead of "Verified customer".
7. Services page: stable coverage-count placeholder (flicker removed).

## Outstanding (dashboard actions, not code)
- Add per-page meta titles/descriptions in Dashboard → SEO & GEO → Meta tags;
  republish to serve server-rendered metadata and refresh the stale home head.
- Optionally delete the unused "Port Coquitlam" pricing row in Admin > Pricing.
- Run a sandbox PayPal capture once through the Testing Agent before the next
  production publish.