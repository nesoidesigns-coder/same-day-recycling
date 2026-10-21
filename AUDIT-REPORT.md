# Same Day Recycling — Production Readiness Audit
**Audit date:** 2026-10-21 · **Target:** samedayrecycling.ca · **Method:** non-destructive (no records created, no pricing/auth/data changed, no destructive testing)

**Headline finding:** the codebase is in good shape, but **the live site is running an older build**. Several corrections already made in code (city lists, "guaranteed" pricing language, coast-to-coast claim, llms.txt, default quote rate) are not on production until the app is re-published.

Legend: ✅ PASS · ❌ FAIL · ⚠️ PARTIAL · ◻️ NOT TESTED (cannot verify from here)

---

## 1. Infrastructure

| Check | Status | Evidence |
|---|---|---|
| Custom domain resolves over HTTPS | ✅ PASS | `https://samedayrecycling.ca` fetched successfully, full page rendered |
| robots.txt served live | ✅ PASS | Admin/company/pay/password paths Disallowed; AI crawlers explicitly allowed; sitemap declared |
| sitemap.xml served live | ✅ PASS | 51 URLs, all on the custom domain, with changefreq/priority |
| llms.txt served live | ⚠️ PARTIAL | Live copy is the **old** version (simple page list). Code copy with service tiers exists but is unpublished |
| www / HTTP→HTTPS redirects | ◻️ NOT TESTED | Only the canonical https host was fetched; www and http variants need an external checker (e.g. redirect-checker tool) |
| Uptime / monitoring | ◻️ NOT TESTED | Single-point fetch success only; no continuous monitor verified. Recommend an external uptime monitor |
| Platform error logs | ◻️ NOT TESTED | Not accessible from the app sandbox — review in **Logs** (dashboard) |
| Deployment currency | ❌ FAIL (High) | Live build ≠ current code. Evidence: live quote/booking city dropdowns list Toronto/Montreal/Ottawa etc. (no Lower Mainland cities); live copy still reads "The price we quote is the price you pay" and "guarantee the quote"; live home page claims "Same-day pickup is now live coast to coast to coast" — none of these strings exist in the current source |

**Correction:** Publish the app (Actions → Publish). Effort: minutes. **Regression test:** re-fetch home page — city dropdown must list Vancouver/Burnaby/Surrey/Richmond/Coquitlam/Kamloops/Kelowna; "coast to coast to coast" string must be gone; llms.txt must contain the service-tier section.

---

## 2. Database

| Check | Status | Evidence |
|---|---|---|
| Schemas + required fields | ✅ PASS | All entities have typed fields, enums and required lists (Booking, SoftwareLicense, LicensePickup, LicenseCustomer, LicenseInvoice, PaypalTransaction, …) |
| Row-level security | ✅ PASS | License entities scoped by `license_email = user.email` OR admin; Booking admin-only for read/update; Provider/Review public-read with admin-only writes; SoftwareInquiry/ContractorApplication intentionally open-create, admin-only read |
| Referential integrity | ✅ PASS | 0 duplicate provider emails (45 providers); 0 orphan LicensePickup license_emails; no orphaned booking→partner references found |
| Record counts | ✅ PASS | Booking 2 (both cancelled — clean test data), Provider 45 (all BC), RecyclingCenter 112, Review 10 (all approved), ServiceQuery 23, SoftwareLicense 3, PaypalTransaction 0, QuoteLead 0 |
| Production data hygiene | ⚠️ PARTIAL | The 3 SoftwareLicense records are **demo data** (`demo.prairie@example.ca`, `demo.atlantic@example.ca`, `demo.aurora@example.ca`) in a production database. Not harmful, but should be purged (or notes-flagged) before real licenses are issued — **needs your approval to delete** |
| Backup availability | ◻️ NOT TESTED | Platform-managed; deleted entities are restorable from the Base44 UI, but I cannot verify backup cadence |

---

## 3. Customer journey

| Check | Status | Evidence |
|---|---|---|
| Quote engine | ✅ PASS | `quoteEstimate` tested live: sofa + fridge → "1/4 truck", $289–$350 (uses Vancouver's owner-configured premium rates). Tiered 1/8→full logic verified against PricingSettings records; city-less default now $139/$269/$649, matching published tables |
| Postal-code validation | ✅ PASS | `PostalCheck.jsx`: FSA regex `^[A-Z]\d[A-Z]`, correct letter→province map (incl. X→NT, Y→YT); invalid input handled |
| Service-area eligibility | ✅ PASS | Single source of truth `src/lib/coverage.js`; pages distinguish Active / Onboarding / Coming Soon |
| Booking form + persistence | ⚠️ PARTIAL | `createBooking` server-validates name/phone/address/items (400 on missing), creates the Booking, emails owner + customer confirmation, returns booking_id. **Not tested end-to-end live** — submitting would create a production record (avoided per audit constraints) |
| City dropdowns | ✅ PASS (code) / ❌ FAIL (live) | Code uses the real city directory; live build shows the old Toronto/Montreal list — fixed by publishing |
| Confirmation messaging | ✅ PASS | Customer email includes status flow and support phone; owner email includes full job details |
| Spam protection on public forms | ❌ FAIL (Medium) | No rate limit or bot check on `createBooking`, `quoteLead`, `contactForm`, `create_license` — each submission fires emails and/or creates records. Correction: add a lightweight per-IP/hour cap inside the functions. Effort: S. **Regression test:** 6 rapid submissions → 6th returns 429 |

---

## 4. Contractor operations

| Check | Status | Evidence |
|---|---|---|
| Registration | ✅ PASS | `partnerPortal` `register` requires company+city, prevents duplicate accounts per email, creates Partner tied to the signed-in email |
| Access restriction | ✅ PASS | Portal resolves partner strictly by the signed-in user's email; 403 if no active partner |
| Dispatch / assignment | ✅ PASS | Bookings filtered by `partner_id` + `assignment_status` only; partner sees only their jobs |
| Status updates | ✅ PASS | State machine enforced server-side: assigned→accepted→completed; decline/accept from wrong state returns 409; unowned booking returns 403 |
| Territory data | ✅ PASS | City-scoped counts; revenue = sum of job_value (honest, computed) |
| Onboarding applications | ✅ PASS | `contractorOnboarding` + AdminApplications console exist with AI review status fields |
| Live end-to-end | ◻️ NOT TESTED | Requires a second test account; no live mutation attempted |

---

## 5. Payments

| Check | Status | Evidence |
|---|---|---|
| Credential handling | ✅ PASS | Client ID/secret read from platform secrets only (`secrets.get`), never in code; only the public clientId is returned by `config`; mode defaults to sandbox |
| Server-side totals | ✅ PASS | Order amounts are read from DB records (booking quote parsed with 25–100,000 clamp; setup fees from the license record) — never from client input |
| Server-side capture | ✅ PASS | `capture` calls PayPal API server-side, stores payer email, flips license to `setup_paid` |
| Duplicate-event protection | ✅ PASS (note) | Capture is idempotent at PayPal (2nd capture errors); DB update keyed on paypal_order_id |
| Webhook signature validation | ❌ FAIL (Medium) | **No webhook listener exists.** Subscription renewals, PayPal-side cancellations and refunds never sync back — a cancelled license stays "active" until an admin acts manually. Correction: add a webhook endpoint + listener URL (v1 notifications verify-signature) and sync status changes. Effort: M |
| Subscription cancellation | ⚠️ PARTIAL | Admin-only `cancel_subscription` works (verifies role, cancels at PayPal, marks records) — but only from the admin side; PayPal-initiated cancellation is not captured (same webhook gap) |
| Refunds | ⚠️ PARTIAL | No in-app refund action; refunds are possible only manually in the PayPal dashboard |
| Provisioning on APPROVED | ❌ FAIL (Low–Med) | `verify_subscription` treats status `APPROVED` as active and provisions the license + invites the user. APPROVED means the buyer agreed, before first charge is confirmed. Correction: require `ACTIVE` only. Effort: S. **Regression test:** mock APPROVED response → license must NOT flip to active |
| Unauthenticated record creation | ❌ FAIL (Medium) | `create_license` on the public endpoint creates SoftwareLicense rows freely (spam vector, mirrors form gap above) |
| Live transaction volume | ◻️ NOT TESTED | PaypalTransaction table is empty; no live or sandbox charge was executed during this audit |

---

## 6. Software licensing

| Check | Status | Evidence |
|---|---|---|
| Purchase → provisioning flow | ✅ PASS (code review) | create_license → pay_token → setup order → subscription verify → status `active`, `provisioned_date` set, user invited as role `user`. Page flow: /software/start → /software-pay?pay=token |
| Account ownership / tenant isolation | ✅ PASS | SoftwareLicense read scoped to `email = user.email` or admin; LicensePickup/Customer/Invoice all scoped by `license_email = user.email` or admin; CompanyDashboard sits behind ProtectedRoute |
| Role-based access | ✅ PASS | Admin routes under ProtectedRoute + admin-only backend guards (dashboardMetrics 403, cancel_subscription 403) |
| Pricing consistency | ✅ PASS | Page tiers (2500/199, 4500/399, 9500/799) exactly match the server FEES table in `paypalCheckout` |
| Subscription expiration enforcement | ❌ FAIL (Medium) | Nothing expires a license if billing lapses (no webhook + no scheduled re-verification). Correction: webhook sync (§5) + a weekly scheduled check that flips `active` licenses with no active subscription. Effort: M |
| End-to-end purchase test | ◻️ NOT TESTED | Would create a real PayPal subscription — needs your approval and a sandbox test account |

---

## 7. Administration

| Check | Status | Evidence |
|---|---|---|
| Dashboard metrics authenticity | ✅ PASS | `dashboardMetrics` is admin-gated, computes real aggregates from Booking/QuoteLead/Review/MetricTargets, marks each metric `verified: true` only when computed; unverifiable metrics return **null with an explicit reason** ("No truck capacity or route records exist yet") — **no mock or hard-coded metrics found** |
| Targets | ✅ PASS | Targets read from MetricTargets entity; hardcoded values are only defaults when no record exists (documented behaviour) |
| Trust gauges (public) | ✅ PASS | Live home page shows "pending data"/blank states instead of invented numbers — honest |
| Financial summaries | ✅ PASS | Revenue = job_value of completed bookings in window, with period-over-period delta |
| Activity logs | ⚠️ PARTIAL | Booking status_history exists; no general admin audit log of who changed what. Low priority |
| Notifications | ✅ PASS | Booking emails (owner + customer), workflow-driven digests exist |
| Reporting accuracy | ⚠️ PARTIAL | QuoteLead and PaypalTransaction are empty — dashboards will legitimately show zero; conversion gauge won't produce a number until quotes flow in (honest, but worth knowing) |

---

## 8. AI assistant

| Check | Status | Evidence |
|---|---|---|
| Retrieval sources | ✅ PASS | Recycling assistant retrieves matches from the app's own Provider directory (taxonomy + location), then LLM with web context for rules |
| Accuracy guardrails | ✅ PASS | Prompt forbids inventing facilities/fees/phones; requires municipal sources; treats photos only as hints; caps length |
| Uncertainty handling | ✅ PASS | Dedicated `uncertainty` field; "if you cannot confirm rules for the user's location, say so" is an explicit prompt rule |
| Escalation | ⚠️ PARTIAL | Directory answers route users to facility pages; phone escalation exists on service pages, but the chat has no "talk to a human" handoff action. Low |
| Privacy | ✅ PASS (assistant) / ❌ FAIL (chat upload) | Assistant sends only public provider data to the LLM. **Receptionist chat stores customer photos publicly** (`ReceptionistChat.jsx` line 78, `UploadPublicFile`) — anyone with the URL can open them. Correction: switch to `UploadPrivateFile` + `CreateFileSignedUrl` at render; touches chat + admin photo display. Effort: S. **Regression test:** uploaded photo URL must 403 without a signed link |

---

## 9. SEO

| Check | Status | Evidence |
|---|---|---|
| robots.txt | ✅ PASS | Live, correct disallows, AI-bot allowlist, sitemap declared |
| sitemap.xml | ✅ PASS | Live, 51 URLs, custom domain only |
| llms.txt | ⚠️ PARTIAL | Live copy is stale (old build) — republish |
| Titles/descriptions/canonicals | ✅ PASS (code) / ◻️ live-verify | Per-page SEO module in place; verify live after publish |
| Structured data | ✅ PASS (code) | JSON-LD (Service, BreadcrumbList, FAQPage, WebPage) implemented; live head not verifiable via markdown fetch — confirm with view-source after publish |
| Internal links | ✅ PASS | Footer/Navbar link graph intact; region + city pages linked |

---

## 10. Content accuracy

| Check | Status | Evidence |
|---|---|---|
| Province labels | ✅ PASS | `regions.js` — all 10 provinces + 3 territories, correct names/capitals/codes |
| Active vs planned expansion | ✅ PASS (code) / ❌ live | Code derives status from verified provider counts, never hardcodes "live"; live build still claims "live coast to coast to coast" |
| Pricing consistency | ✅ PASS | Quote engine, DB records, published ladder and Terms aligned ($139/$269/$649 default; per-city rates surfaced on city pages) |
| "Guaranteed" language | ✅ PASS (code) / ❌ live | Corrected in code; live copy still says "guarantee the quote" / "the price we quote is the price you pay" |
| Software pricing | ✅ PASS | Page tiers = server FEES exactly |

---

## 11. Security

| Check | Status | Evidence |
|---|---|---|
| Authentication | ✅ PASS | Platform-owned auth (sessions, verification, reset); app never implements token logic |
| Authorization | ✅ PASS | Admin-only RLS + in-function role checks on every privileged endpoint reviewed |
| Server-side validation | ✅ PASS | All reviewed functions validate/trim/length-cap inputs before writes |
| Secrets | ✅ PASS | PayPal credentials only via platform secrets; nothing hardcoded |
| Customer-data isolation | ✅ PASS / ❌ FAIL (photos) | Records isolated by RLS; **customer photos public** (see §8) |
| Rate limits / API abuse | ❌ FAIL (Medium) | No throttling on public write endpoints (bookings, quotes, contact, license creation). Effort: S per endpoint |
| Audit logging | ⚠️ PARTIAL | status_history on bookings only; no global audit trail. Low |
| Security scan | ◻️ NOT TESTED | Run from dashboard: Security → Run scan |

---

## 12. Performance

| Check | Status | Evidence |
|---|---|---|
| Build health | ✅ PASS | `npm run build` succeeds cleanly |
| Mobile readiness | ✅ PASS | Global CSS safeguards (overflow-x clip, heading scaling, 16px inputs, scrollable tables); responsive components throughout |
| Image optimization | ✅ PASS | Content images rendered via the platform Image component (responsive srcset) |
| External tile/CDN loads | ⚠️ PARTIAL | OpenStreetMap tiles + Google Fonts are external dependencies — map pages depend on third-party uptime |
| Page-load / Lighthouse / accessibility | ◻️ NOT TESTED | No browser tooling in the sandbox — run PageSpeed Insights on the live URL; Lighthouse a11y audit recommended |

---

## Production readiness assessment

**Verdict: CONDITIONAL GO — publish + 4 corrections.**
The platform fundamentals (auth, RLS, server-validated endpoints, honest metrics, coverage source of truth) are solid. The single biggest issue is that production runs a stale build that still carries overstated claims and wrong city lists. No critical data-integrity or booking failures were found; payments work for the flows that exist but lack webhook sync.

## Prioritized remediation roadmap

| # | Item | Severity | Effort | Dependencies |
|---|---|---|---|---|
| 1 | **Publish the app** — puts all code-level fixes (claims, city lists, pricing, llms.txt) live | High | Minutes | None |
| 2 | Private storage for customer photos (UploadPrivateFile + signed URLs) | High (privacy) | S (S) | None |
| 3 | Rate-limit public write endpoints (booking, quote, contact, create_license) | Medium | S | None |
| 4 | PayPal webhook listener + signature validation; sync renewals/cancellations/refunds; require ACTIVE (not APPROVED) before provisioning | Medium | M | PayPal developer dashboard webhook URL registration |
| 5 | Weekly scheduled license-subscription health check (expiration enforcement) | Medium | S | #4 |
| 6 | Purge the 3 demo SoftwareLicense records (needs your approval) | Low | Minutes | Your approval |
| 7 | Human-handoff action in receptionist chat | Low | S | None |
| 8 | External uptime monitor + PageSpeed Insights pass | Low | Minutes | Third-party tool |

## Regression tests for each correction
1. **Publish:** re-fetch live home — city dropdown lists the 7 served cities; "coast to coast to coast" and "guarantee the quote" absent; /llms.txt contains service tiers.
2. **Private photos:** upload a chat photo → direct URL access must be denied; signed link renders; admin photo views still work.
3. **Rate limits:** fire 6+ rapid submissions → 429; a normal single submission still succeeds.
4. **Webhooks:** send a signed PayPal BILLING.SUBSCRIPTION.CANCEL sample → license flips to cancelled; tampered signature → 400 rejected; a capture captured twice updates the record once.
5. **Expiration check:** license with no active subscription + ticked check → status flips to paused; active subscription untouched.
6. **Demo purge:** license count returns 0; admin console shows no demo rows.
7. **Handoff:** ask the chat for "a human" → shows the call CTA.