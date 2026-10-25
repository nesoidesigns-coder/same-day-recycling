import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import GaugeWall, { countScale, moneyScale } from "@/components/admin/gauges/GaugeWall";

// Gauge battery for the Command Centre: every collected business metric as a
// readable gauge. Scaling rules (in order):
//   1. My targets — uses MetricTargets (set in Analytics) where one is mapped.
//   2. Period targets — counts scale to the next sensible round number;
//      "today vs norm" scales to the 14-day median/peak.
//   3. Simple magnitude — no target assumed; the value is shown plainly.
const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const num = (n) => (Number(n) || 0).toLocaleString("en-CA");

const TARGET_METRIC = {
  conversion: "quote_conversion",
  booking_completion: "completion_rate",
  collected_revenue: "revenue_target",
  commission: "revenue_target",
};

export default function BiGaugeBattery({ data: propData }) {
  const [data, setData] = useState(propData || null);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(!propData);

  useEffect(() => {
    base44.entities.MetricTargets.filter({}).then(setTargets).catch(() => setTargets([]));
  }, []);

  useEffect(() => {
    if (propData) { setData(propData); setLoading(false); return; }
    base44.functions.invoke("businessIntel", {})
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [propData]);

  if (loading) {
    return <div className="rounded-[14px] border border-li-steel bg-white p-10 text-center text-sm text-li-slate">Loading gauges…</div>;
  }
  if (!data) {
    return <p className="rounded-[14px] bg-li-red/10 border border-li-red/40 p-5 text-sm text-li-red">Could not load business intelligence for the gauges. Refresh or check System Health.</p>;
  }

  const a = data.acquisition || {};
  const t = data.traffic || {};
  const p = data.performance || {};
  const dev = data.development || {};
  const daily = t.daily || [];
  const lastDay = daily.length ? daily[daily.length - 1].human || 0 : 0;
  const peakDay = Math.max(0, ...daily.map((d) => d.human || 0));
  const sorted = daily.map((d) => d.human || 0).filter((n) => n > 0).sort((x, y) => x - y);
  const medianDay = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

  const tgt = (key) => {
    const row = targets.find((x) => x.metric === TARGET_METRIC[key]);
    return row ? { target: row.target, warning: row.warning } : {};
  };
  const defined = data.definitions?.metrics || {};

  const sections = [
    {
      title: "Acquisition & conversion",
      gauges: [
        { label: "Visitor sessions (30d)", value: t.sessions || 0, max: countScale(t.sessions || 0), unit: "", sub: "Anonymous session keys · page-loads without a session key are excluded", tooltip: defined.sessions },
        { label: "Customer-intent visits (30d)", value: a.intent_visits || 0, max: countScale(a.intent_visits || 0), unit: "", sub: "Buying behavior on service, pricing & booking pages", tooltip: defined.customer_intent },
        { label: "Qualified leads (30d)", value: a.qualified_leads || 0, max: countScale(a.qualified_leads || 0), unit: "", sub: "Captured quote requests", tooltip: defined.qualified_leads },
        { label: "Confirmed bookings (30d)", value: a.confirmed_bookings || 0, max: countScale(a.confirmed_bookings || 0), unit: "", sub: "Tests & cancelled excluded", tooltip: defined.confirmed_bookings },
        { label: "Session-to-booking conversion", value: a.conversion?.visit_to_booking_pct ?? 0, max: 100, unit: "%", ...tgt("conversion"), sub: "Confirmed bookings ÷ visitor sessions", tooltip: defined.conversion_rate },
        { label: "Intent-session conversion", value: a.conversion?.intent_session_to_booking_pct ?? 0, max: 100, unit: "%", ...tgt("conversion"), sub: "Confirmed bookings ÷ intent sessions" },
        { label: "Lead-to-booking conversion", value: a.conversion?.lead_to_booking_pct ?? 0, max: 100, unit: "%", ...tgt("conversion"), sub: "Confirmed bookings ÷ captured leads" },
        { label: "Collected revenue (30d)", value: a.revenue_collected || 0, max: moneyScale(Math.max(a.revenue_collected || 0, 0)), unit: "", display: money(a.revenue_collected || 0), ...tgt("collected_revenue"), sub: "Platform + owner-verified external payments", tooltip: defined.completed_payments },
      ],
    },
    {
      title: "Traffic health",
      gauges: [
        { label: "Page views (30d)", value: t.pageviews_30d || 0, max: countScale(t.pageviews_30d || 0), unit: "", sub: `${num(t.pageviews_all_time)} recorded all time`, tooltip: defined.pageviews },
        { label: "Returning visitors (30d)", value: t.returning_visitors || 0, max: countScale(Math.max(t.returning_visitors || 0, t.sessions || 0)), unit: "", sub: "Sessions with 2+ recorded visits" },
        { label: "Attribution coverage", value: t.attributed_pct ?? 0, max: 100, unit: "%", target: 70, warning: 30, sub: "Visits with a known traffic source", tooltip: "Empty referrer stays Direct / unknown — never re-labelled without evidence." },
        { label: "Visitors today vs 14d norm", value: lastDay, max: Math.max(peakDay, lastDay, 10), unit: "", target: medianDay > 0 ? medianDay : undefined, sub: medianDay ? `Today ${num(lastDay)} · 14d median ${num(medianDay)} · peak ${num(peakDay)}` : "Building the 14-day series", tooltip: defined.human_visits },
      ],
    },
    {
      title: "Business performance",
      gauges: [
        { label: "Booking completion rate", value: p.booking_completion_pct ?? 0, max: 100, unit: "%", ...tgt("booking_completion"), sub: "Completed of confirmed jobs", tooltip: defined.booking_completion_pct },
        { label: "Commission earned (30d)", value: p.revenue?.commission_earned || 0, max: moneyScale(p.revenue?.commission_earned || 0), unit: "", display: money(p.revenue?.commission_earned || 0), ...tgt("commission"), sub: "From completed platform jobs" },
        { label: "Contractor-matched jobs (30d)", value: p.contractor_matched_jobs || 0, max: countScale(p.contractor_matched_jobs || 0), unit: "", sub: "Assigned to a verified partner" },
        { label: "Unfulfilled requests", value: p.unfulfilled_requests || 0, max: countScale(p.unfulfilled_requests || 0), unit: "", sub: "Open national dispatch requests — lower is better" },
      ],
    },
    {
      title: "Traffic quality (excluded from customer metrics)",
      gauges: [
        { label: "Owner visits (30d)", value: dev.owner_visits_30d || 0, max: countScale(dev.owner_visits_30d || 0), unit: "", sub: "Your testing & administration" },
        { label: "Bot visits (30d)", value: dev.bot_traffic_30d || 0, max: countScale(dev.bot_traffic_30d || 0), unit: "", sub: "Crawlers & automated requests" },
        { label: "Unclassified (all time)", value: t.owner_bot?.unclassified_all_time || 0, max: countScale(t.owner_bot?.unclassified_all_time || 0), unit: "", sub: "Historical records — never counted as customers" },
        { label: "Internal test bookings", value: dev.internal_test_bookings || 0, max: countScale(dev.internal_test_bookings || 0), unit: "", sub: `${num(dev.stale_test_bookings)} older than 7 days` },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {sections.map((s) => (
        <div key={s.title}>
          <h3 className="font-plex mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-li-slate">{s.title}</h3>
          <GaugeWall gauges={s.gauges} />
        </div>
      ))}
      <p className="text-[11px] text-slate-500">
        Gauge scales: percentage gauges use 0–100 or your targets; count gauges scale to the next sensible round number above current volume; the daily-visitor gauge scales to the 14-day peak with the median as its marker; revenue gauges use your revenue target when one is set (editable in <strong>Analytics</strong>). Gauges without a target show the value plainly — nothing is invented.
      </p>
    </div>
  );
}