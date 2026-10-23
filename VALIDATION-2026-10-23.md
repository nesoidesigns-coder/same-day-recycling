# VALIDATION-2026-10-23 — Recycling OS National Operations Upgrade

Scope: 9-phase master command audit, gap fix, and end-to-end lifecycle validation.
Method: code-path audit of every phase against production files, then a sandbox-safe
lifecycle run (test contractor excluded from real capacity, no live charges, no real
partner offers, all customer-facing email self-addressed to the business inbox).

## Phases 1–5, 7–8 — ALREADY IN PRODUCTION (verified, not rebuilt)

| Phase | Requirement | Where it lives today | Verdict |
|---|---|---|---|
| 1 | ServiceTerritories | `coverageStatus` engine (single source of truth) + 4 states incl. job-specific "Booking Confirmed" | PASS |
| 1 | Contractors / Availability | `Partner` (verified, dispatch_mode, service_types, equipment) | PASS |
| 1 | ServiceRequests / JobAssignments | `NationalRequest` + `LeadOffer` (offer waves, acceptance, expiry, escalation) | PASS |
| 1 | CustomerQuotes / PriceApprovals | `quoteEstimate` + `approved_quote_amount` / `approval_method` / `ChangeOrder` secure-token approvals | PASS |
| 1 | Payments / Receipts | `PaypalTransaction` + `rexSales` + Recycling Impact Report PDF | PASS |
| 1 | ContractorSettlements | `feeEngine` snapshots + commission fields + `AdminPayouts` | PASS |
| 1 | Subscriptions / SoftwareLicenses / AuditLogs | `Subscription`, `SoftwareLicense`, `FinancialAuditLog` + `AiActionLog` | PASS |
| 1 | Nationwide intake, never request=appointment | `createBooking` guard + engine copy | PASS |
| 2 | Rex operations coordinator | `receptionist` agent + `AiActionLog` audit trail + escalation outcomes | PASS |
| 3 | Contractor portal & verification | `PartnersDashboard` + `partnerPortal` + `AdminApplications` verification workflow | PASS |
| 4 | Centralized pricing engine | `pricing.ts` / `quoteEstimate` (national card + verified city override, breakdown before submit) | PASS |
| 5 | Recycling OS commercial platform | tenant-isolated `FinancialTx` RLS + white-label/software license billing + dashboards | PASS |
| 7 | Trust & communication | Terminology, status indicators, approval language audited 2026-10-23 | PASS |
| 8 | Command centre | `AdminOverview` gauges; demo data separated via `record_type: internal_test` | PASS |

## Phase 6 gap — FIXED this session

Recycling documentation was generated per job (PDF) but never persisted.

**Added `RecyclingRecord`** — per completed job: material categories, item-group
diversion math, weight (`not_measured` until measured — never invented), destination
facility (empty until admin-verified, matched from the `RecyclingCenter` directory),
disposal receipt URI, impact-report status, and a `reported → verified` state that an
admin confirms. `recyclingReceipt` now persists this record on every completed job,
reuses it on re-runs (no duplicates), and treats a rate-limited email as non-fatal so
documentation always survives.

## Phase 9 — End-to-end lifecycle run (LCTEST01, sandbox-safe)

| Stage | Result |
|---|---|
| Customer inquiry (national intake) | PASS — request created with postal code, province, quote |
| Preliminary estimate | PASS — $199 carried on the request before any offer |
| Contractor matching | PASS — offer created for sandbox contractor (excluded from real capacity) |
| Contractor acceptance | PASS — exercised through the real dispatch engine; booking + fee terms snapshot created |
| Customer price approval | PASS — $199 approved amount, secure-link method, date recorded |
| Booking confirmation | PASS — appointment window tied to acceptance, never before it |
| Authorized payment | **NOT EXECUTED — by directive.** `PAYPAL_MODE` is `live`; sandbox credentials are required before any capture test. Order-creation/capture remain untested end-to-end. |
| Job completion | PASS — completed, on-time arrival, final invoice recorded |
| Receipt | PASS (generation + persistence) — the impact-report email was **captured, not delivered**: the platform's hourly email limit was hit. Trigger the receipt flow in the app later for a real delivery. |
| Recycling documentation | PASS — RecyclingRecord persisted (4 item groups, 3 diverted, 75%, facility matched, status `reported`) |
| Review request | PASS — flagged on the booking; the Review Requests workflow handles the send |

## Findings & remaining risks

1. **Payments: sandbox required.** PayPal is in `live` mode. Per the master directive,
   no capture test was run. Obtain sandbox credentials (switch `PAYPAL_MODE`), run the
   full order → approve → capture on a test booking, then re-enable production.
2. **Email rate limits.** The hourly/daily email cap was hit during validation (known
   issue). It no longer breaks job documentation, but notification volume should be
   throttled or moved to a dedicated transactional provider if it recurs.
3. **RecyclingRecord is `reported` until an admin verifies** destination facility and
   outcome — do not present diversion figures as verified until then.
4. All test records are marked `record_type: internal_test` / `zztest` names and are
   excluded from real metrics, contractor capacity, and offers by design.

## Phase 10 — Failure-path validation (sandbox, 2026-10-23 session 2)

| Test | Result |
|---|---|
| Contractor declines an offer | PASS — offer marked `declined`; escalation ran; because every candidate was a test partner (correctly excluded from capacity), the request landed in the matching queue with a single deduped `escalation_alert` in the dispatch log |
| Offer expiry sweep | PASS — stale offer flipped to `expired` by the escalation action; no duplicate admin alert (dedupe by contact log works) |
| Booking cancellation | PASS — booking → `cancelled` with assignment released and status history appended |
| Invalid change-order token | PASS — safely rejected (404, "Change order not found"), no crash, no email |
| Unsuccessful payment capture | **NOT EXECUTED** — `PAYPAL_MODE` is `live`; requires sandbox credentials before any negative payment test |
| Tenant isolation | Config-verified — `FinancialTx` RLS anchors every read/write on `owner_email = {{user.email}}` (admins excepted); sandbox service-role sees both tenants, app users cannot. Cross-tenant write tests require a second non-admin user. |

Admin-alert emails from these tests were captured, not delivered (hourly email limit, known issue — non-fatal by design).

### Consumer vs Recycling OS commercial journeys
- Consumer homepage remains request-focused; the commercial product area lives at `/software` (memberships, white-label licensing, AI dispatch, invoicing, analytics) with the license onboarding wizard.
- A dedicated top-level navigation item "Recycling OS" now routes commercial visitors to `/software` from every page.
- Subdomain `operating.samedayrecycling.ca` evaluated and deferred — DNS untouched pending approval, as directed.

## Recommended next deployment steps

1. Add PayPal sandbox credentials and run the payment capture test end-to-end.
2. Verify the LCTEST01 RecyclingRecord in the admin panel to exercise the
   `reported → verified` path, then archive the test job.
3. Trigger the recycling receipt flow in the app (after the email window resets) to
   confirm real delivery of the impact report.
4. Publish so the `RecyclingRecord` entity and documentation persistence go live.