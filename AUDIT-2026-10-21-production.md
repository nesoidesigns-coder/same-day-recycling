# Production-Readiness Audit — samedayrecycling.ca
**Date:** 2026-10-21 · **Scope:** Coverage integrity, operational functionality, software licensing, contractor network, SEO/technical access.
**Method:** Live function tests (sandbox-safe), database inspection, code review of all dispatch/payment/coverage logic, live-site fetches. No live charges created; no live payment settings changed.

---

## P1 — Coverage Integrity

| Feature | Result | Evidence |
|---|---|---|
| Single authoritative coverage source | **PASS** | One live source: `coverageStatus` endpoint derives capacity from active Partner records + open requests; `useCoverageStatus()` feeds Coverage page, CoverageMap, CityPage, QuoteCalculator. No second hardcoded status list remains (the stale legacy list was the bug found below — fixed). |
| Nationwide inquiry acceptance vs same-day availability | **PASS** | Tested: request from **Moose Jaw** (uncovered market) → accepted, status `recruiting`, dispatch task auto-created, message promises nothing ("Nothing is scheduled or charged before a contractor accepts"). Server guard on direct booking (`createBooking`) restricts confirmed bookings to registry cities (422 with redirect message otherwise). |
| Not labeling all 29 cities "Same-Day Confirmed" | **PASS (after fix)** | Same-day status exists ONLY where an active verified Partner exists. Before fix: test partners inflated it (see FAIL 1). After fix: only **North Vancouver** shows Same-Day Availability. |
| Homepage / coverage / region / booking / service finder sync | **PASS (after fix)** | Homepage hero states "Requests open in every province & territory — same-day fulfillment depends on contractor availability." Coverage page + map use the three live states. FAIL 2 (stale labels) fixed. **Note: the live site still shows the old labels until the app is republished.** |
| Nationwide lead intake + contractor matching preserved | **PASS** | Unmatched-market inquiry produced a recruitment task and admin alert; matching engine untouched. |

### Issues found & fixed
1. **FAIL (fixed): Test partners inflated public coverage.** Four `ZZTEST` partners made Kelowna (4 contractors) and Halifax (1) appear "Same-Day Availability" on public pages; Halifax's only "contractor" was `ZZTEST WrongCity`. Live evidence: `coverageStatus` returned `verified_cities: [Kelowna, Halifax, North Vancouver]` before the fix, `[North Vancouver]` after.
2. **FAIL (fixed): Stale city labels contradicting live status.** Every booking/quote dropdown labeled all 29 cities "(onboarding)"; city-page hero copy said "coming to X through our partner onboarding program" and SEO text said "service is not live here yet" — while requests were open nationwide. `cityLabel` and all copy in the shared city registry corrected.
3. **Flag (not deleted):** Prior test request `99B6393C` (ZZTEST Customer, Kelowna) is still open in the matching queue; its offers keep expiring/escalating each sweep. Recommend deleting it in /admin/national.

---

## P2 — Operational Functionality

| Feature | Result | Evidence |
|---|---|---|
| Quote generation | **PASS** | `quoteEstimate` (sofa + fridge, Vancouver) → "$289 – $350", 2.2 eighths, 362ms. City pricing lookup + curbside logic intact. |
| Form validation | **PASS** | `createBooking` with all fields empty → 400 "Missing required fields" in 367ms. Length caps and sanitization present in code. |
| Request submission + database persistence | **PASS** | Booking created and persisted (`booking_id 6ad93ac1…`, verified in DB, then deleted). Rate limiting (5/IP) active. |
| Customer notifications | **PARTIAL FAIL** | Owner alert email: **failed — "recipient reached their daily email limit."** (Known issue; email quota, not code. Customer email skipped when not provided.) Retry works; consider staggering automated sends. |
| Contractor matching (auto) | **PASS** | Live data: request `6ad935e4…` round-1 offer to ZZTEST Alpha **expired** → sweep escalated → round-2 offer to ZZTEST Beta. Confirmed request shows accepted + other offers superseded. |
| Escalation sweep | **PASS** | Workflow active; runs `[ok]` at 22:00 and 22:15 today (30s step). |
| Job assignment / manual authority | **PASS (code)** | `adminAssign`/`adminReassign` supersede open offers; manual wins over auto. Live test requires an admin session — **NOT TESTED live**. |
| Completion tracking | **PASS (code)** | State machine enforced (`assigned→accepted→completed`), status history appended on every contractor action, invalid transitions rejected (409). Live run NOT TESTED (needs contractor login). |
| Admin dashboards receive submissions | **PASS (persistence)** | Records land in Booking / NationalRequest / DispatchTask — the same entities the admin tabs read. Dashboard rendering NOT TESTED (requires admin login). |
| Failure / duplicate / unmatched handling | **PASS** | Unmatched market handled (Moose Jaw test); validation failure handled; subscription duplicate prevention (409 + pending-agreement reuse) in code. |

---

## P3 — Software Licensing

| Feature | Result | Evidence |
|---|---|---|
| PayPal sandbox checkout | **NOT TESTED — do not sandbox-test now** | `paypalCheckout config` returned **`mode: "live"`**. Testing checkout against live mode would create real charges, so checkout capture was deliberately NOT exercised. To test: switch the PAYPAL_MODE secret to `sandbox` with sandbox credentials, test, then switch back. |
| Webhook verification | **PASS** | Tamper test: POSTed a fabricated event id → **401 "Event could not be verified with PayPal."** Every inbound event is re-fetched from PayPal's API; fake events are rejected. |
| Setup fees / subscriptions (code) | **PASS (code)** | License plans ($2,500/$199 · $4,500/$399 · $9,500/$799 setup/monthly), duplicate-agreement reuse, annual = 10× monthly. Capture/order paths reviewed. |
| Activation discipline | **PASS (code)** | Accounts activate ONLY on PayPal-confirmed `ACTIVE` subscription (`verify_subscription` + `BILLING.SUBSCRIPTION.ACTIVATED` webhook). A checkout redirect (`APPROVED`) alone never activates. One-time orders only after `COMPLETED` capture, idempotent on retries. |
| Cancelled bookings can't be paid | **PASS (code)** | 422 guard; if a capture somehow lands on a cancelled booking it is flagged for admin review and NOT marked paid. |
| Cancellation / suspension | **PASS (code)** | Admin-only cancel (403 otherwise); SUSPENDED/DENIED events set paused state. Live PayPal calls NOT TESTED (live mode). |
| Tenant isolation & RBAC | **PASS (code)** | Partner portal scopes every query by the signed-in partner's own email/id; agreements & licenses readable only by the record's email or admins; cancel/refund admin-only. Multi-account live isolation test NOT TESTED. |

---

## P4 — Contractor Network

| Feature | Result | Evidence |
|---|---|---|
| AI follow-ups | **PASS** | "AI Lead Follow-Ups" workflow active, ran ok 2026-10-19/20/21. "Contractor Inquiry Chase" active, ran today. "Quote Lead Follow-Ups" active, ran today. |
| Booking tracking (public) | **PASS** | `requestLookup` with reference code `99B6393C` returned full status, contractor, dates. |
| Territory management | **PASS (code) / NOT TESTED live** | Partner portal territory + reporting actions scoped per partner; requires contractor login to exercise. |
| SEO analytics | **NOT TESTED** | `searchConsoleKeywords`, `seoInsights` functions exist; the 25 pending pages + 1 coverage error are Search Console actions on your side. |
| Membership vs software pricing separation | **PASS (code)** | Network membership lives in ContractorAgreement (`membership_fee_monthly`, territory subscription fields); standalone OS licensing lives in SoftwareLicense with its own plans and checkout. Separate entities, separate payment purposes. |
| Under-development labeling | **PASS** | Homepage gauges with no data show "Not yet tracked" rather than fabricated numbers; directory stats state their source and reporting period. |

---

## P5 — SEO & Technical Access

| Feature | Result | Evidence |
|---|---|---|
| robots.txt | **PASS** | Fetched live: correct disallows (/admin, /company, /partners, /partner-register, pay + auth pages, /functions/, /api/); sitemap declared. |
| sitemap.xml | **PASS** | Valid, dated 2026-10-21: all 29 city pages, region pages, blog, services, legal pages. |
| Public crawlability without auth | **PASS** | Home, /coverage and /junk-removal-kelowna fetched without authentication with full rendered content. |
| Metadata & indexing directives | **PASS (code)** | City pages set index/follow meta + breadcrumb + FAQ structured data; not-found variants noindex. Live header inspection NOT TESTED (fetcher returns rendered content only). |
| 404 handling | **NOT TESTED** | |
| Page speed (Core Web Vitals) | **NOT TESTED** | Requires PageSpeed Insights API (still pending key). Mobile readability safeguards are present app-wide in CSS. |
| Mobile navigation / form accessibility | **PASS (spot check)** | Mobile nav + full form markup render at 411px viewport in the preview; labels present on all booking fields. |
| Pending indexing (25 pages) & 1 coverage error | **USER ACTION** | Resolve in Google Search Console + the SEO panel's Advanced settings (sitemap) — not fixable in app code. |

---

## Fixes applied this audit
1. Test/sandbox partners (`ZZTEST…`, `@example.com`, "test simulation contractor") are now excluded from public contractor-capacity counts **and** from real job offers — one shared rule, applied in both the coverage endpoint and the dispatch engine. Kelowna and Halifax correctly dropped from "Same-Day Availability."
2. All 29 city labels, hero blurbs and SEO descriptions corrected to the live model: requests open nationwide, same-day pickup confirmed per job. **Republish to push these to the live site.**
3. Audit test records removed (test booking, Moose Jaw request + its dispatch task); demand-counter restored.

## Recommended next actions
- Republish so the corrected labels go live.
- Delete leftover ZZTEST request `99B6393C` in /admin/national.
- Switch PAYPAL_MODE to sandbox (with sandbox credentials) before any checkout testing; revert to live for production.
- Stagger or raise the email quota usage — owner alerts failed on the daily limit during testing.