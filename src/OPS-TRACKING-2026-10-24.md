# Live Operations & Tracking — Implementation Report (2026-10-24)

Scope: operational tracking infrastructure on top of the existing booking, dispatch, payment and custody records. Nothing existing was replaced; all prior functionality, integrations, pricing and records are untouched and verified in the production build.

## Implemented (live)

**1. National Operations Command Center** — Admin → Live Operations (`/admin/ops`)
- Live gauges from real records: active jobs, jobs awaiting contractor acceptance, jobs in progress, completed jobs, revenue collected (verified paid jobs only), pending contractor payouts (net of each job's own recorded fee terms), contractors available, open dispatch requests, custody records (verified/reported/missing).
- Canadian service map (existing dispatch map, fed live), filtering by province, city, contractor and date range.
- Jobs table with current lifecycle stage, delayed-job flags, value and payment state; click-through to the full lifecycle drawer.
- Problems panel (delayed pickups, confirmed-but-unassigned, missing disposal documentation, stale requests) and a recent-exceptions feed.
- Auto-refreshes every 60 seconds. No simulated statistics.

**2. Complete job lifecycle tracking**
- New `TrackingEvent` entity: every event records stage, timestamp, responsible actor and source. 13 canonical stages from inquiry to receipt, plus exception events (cancelled, rescheduled, failed payment, price adjustment, additional items).
- Timelines are **derived from the job's own records** (created, quote, approval, payment, assignment, pickup, custody, completion, receipt) and merged with witnessed events — so even historical bookings have an honest timeline, and derived stages are labelled "from record", never presented as live sightings.
- Non-exception stages are idempotent: re-running a flow never duplicates history. Exceptions are append-only.
- Admin can record field events (en route, arrived, in progress, loaded) and exceptions per job, with actor and note.

**3. Customer tracking portal** — `/track`
- Mobile-first, no account: the customer enters the 8-character reference code from their confirmation (rate-limited lookup, code is the only key).
- Shows service details, scheduled window, contractor assignment, approved pricing, payment status, the 13-stage progress bar, full timeline, disposal documentation and receipt status. Phone/email/address are never returned.

**4. Chain of custody**
- Contractors record materials collected (donated/recycled/e-waste/disposed counts), load weight with source (estimated vs weigh-scale measured), destination facility, and upload the facility receipt from their phone (stored privately) — in their partner dashboard. Records start as `reported`; only an admin verification (with the receipt) marks them `verified`.
- Diversion percentage is computed only from entered group counts. Customer reports show "reported" vs "verified" explicitly — no invented percentages.
- Admin verifies/edits custody per job in the Live Operations drawer.

**5. Financial clarity**
- Revenue gauges separate verified collected revenue (final invoice on paid jobs) from job value; pending payouts are net of each job's recorded fee terms (no double counting); existing payment infrastructure untouched.

## Existing infrastructure reused (not replaced)

- Booking reference codes, status history and assignment lifecycle (tracking derives from them)
- Dispatch engine, lead offers and escalation sweeps
- RecyclingRecord chain-of-custody entity and the recycling receipt/impact report flow
- Partner portal auth (partner email → own jobs only), Finance dashboard, Platform Integrity dashboard, Continuous Diagnostics and system health workflows
- Payment records (PayPal/webhooks), Visit tracking, Google Sheets exports

## Outstanding / deferred

- **Live crew GPS location:** no consented location source exists yet; the map shows job locations and coverage, not crew positions, and no ETA is ever displayed as fact. Adding true live tracking requires a contractor-side location consent flow.
- **Rex operations Q&A:** Rex already answers over live data via the receptionist and intelligence functions; a dedicated ops-question surface for the command center is a natural next step.
- **Accounting downloads:** already exist via the finance Sheets export; a PDF ops export can be added on request.
- **Historical bookings** created before reference codes existed show blank codes in tracking; new bookings always get one.
- System-health checks (webhook failures, duplicates, stale data) already run through Continuous Diagnostics and Platform Integrity; their findings surface alongside the ops problems panel rather than being duplicated here.

## Validation

- Production build passes; `jobTracking` tested live: public lookup (valid/invalid codes), admin ops snapshot against real records (2 partners, 2 custody records, 1 missing-custody finding correctly detected), and timeline reconstruction on an existing booking.
- Role separation enforced: admin-only ops/timeline/record/custody endpoints (401/403); partner custody restricted to the contractor's own jobs; customer portal exposed only through the random reference code.