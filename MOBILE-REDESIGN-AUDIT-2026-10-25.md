# Recycling OS — Mobile-First Demand Intelligence Redesign Audit
**Date:** 2026-10-25 · **Scope:** / (homepage), /service-finder, /request-service, /request-status, /track, /services, /move-assist, /live, admin Command Centre

---

## 1. Before-and-after audit

### Method
Automated Playwright audit (`mobileLayoutCheck` backend function) against the live deployment at
396px viewport, element-level: every element wider than the viewport, with its layout chain,
computed white-space and min-width. Plus Vite production build verification of all code changes.

### Findings at 396px (published build, BEFORE)
| Path | Horizontal overflow | Root cause |
|---|---|---|
| `/` homepage — Signal Core filter row | **YES — card rendered 872px wide** inside a 396px viewport. Province `<select>` measured 830px (`white-space: pre`, non-shrinkable in a `flex-wrap` row) | The select sat in a flex row with `ml-auto` time switcher; the row could not shrink, blowing out its grid track. `overflow-x: clip` on html/body then **hid the right half of the card on phones** — the city select, time switcher and right side of the gauge were unreachable. |
| `/service-finder` quick-job chips | No page overflow (chips scroll inside their own `overflow-x-auto` row) — OK | — |
| All other tested pages (`/request-service`, `/request-status`, `/track`, `/services`, `/move-assist`, `/live`) | None (`scrollWidth == viewport`) | — |

Screenshot of the before state was captured by the audit run; the overflow elements were the
Signal Core filter row and its select/switcher chain.

### Repairs applied (this change set)
1. **Homepage Signal Core (confirmed defect, repaired)**
   - Filter row reflows to a stacked column under 640px; selects become full-width (capped `max-w-full`) and the time switcher becomes a full-width segmented control on phones.
   - Card root gets `min-w-0` so the two-column desktop grid can never force a track wider than the screen.
2. **New unified DemandGauge system** (`src/components/demand/DemandGauge.jsx`) — single source of truth for ring / mini / bar gauges, status chips (Verified / Estimated / No verified data yet), trend badges, horizontal demand bars and the mandatory metadata footer (metric name, value+unit, period, source, updated, methodology, status).
3. **National Demand Pulse** (`src/components/home/NationalDemandPulse.jsx`) on the homepage immediately below the booking entry — national verified-records ring + ranked category bars, each drill-down action opening the full explorer at `/live`. The thin static "Live national activity strip" was replaced by this richer pulse (same data, same source).

### Verification AFTER (code level)
- `vite build` exits clean with all changes.
- Runtime re-audit runs against the **published** build, so the 396px re-check should be repeated right after the next **Publish** (the audit tool `mobileLayoutCheck` is kept for exactly that — run `{"path":"/"}` and expect `overflowing: []`).

---

## 2. Unified gauge system — what exists now
- `DemandGauge` variants: large circular ring (single value or category segments), compact mini tile, horizontal bar breakdown; `DemandStatusChip`, `DemandTrendBadge`, `GaugeMeta`, shared `DEMAND_PALETTE`.
- Every gauge renders the mandatory context block; a gauge with no verified data shows "No verified data yet" — never a decorative zero.
- First consumer: homepage National Demand Pulse. The homepage Signal Core keeps its richer interactive ring (same records, same palette).

## 3. Data layer status
- Active and verified: platform demand records (QuoteLead + NationalRequest observations, partner territories, bookings) via `liveIntelligence`.
- Explicitly separated: search interest vs public requests vs inquiries vs confirmed bookings — never blended.
- Still required (unchanged): Google Search Console secret provisioning for search-performance gauges; Reddit API credentials for public discovery signals; Keyword Planner credentials for licensed volume estimates. Google Trends normalized interest remains labeled *estimated trend*, never absolute volume.

## 4. Remaining work (deferred, in order)
1. Roll `DemandGauge` through the admin Command Centre gauge walls (currently bespoke SpeedometerGauge/ProgressRing visuals — visually consistent already via LI tokens, but not yet the shared component).
2. Contractor-facing gauge set (local qualified demand, unmatched requests, conversion, fulfillment) on the partner dashboard, permission-scoped to the signed-in partner.
3. 3D globe fallback + booking wizard touch-target pass at 320px/430px.
4. Re-run the runtime mobile audit after Publish and archive the screenshots.