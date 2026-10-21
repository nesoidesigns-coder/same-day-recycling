import { base44 } from "@/api/base44Client";
import { Gauge, DollarSign, BellRing, MapPinned, CalendarClock, Quote } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

const panel = "relative overflow-hidden rounded-2xl border border-[#1d9e56]/25 holo-panel-deep backdrop-blur-sm p-5";
const label = "text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/60";

export default function ControlKpis({ bookings, quoteNew, clients }) {
  const todayKey = new Date().toLocaleDateString("en-CA");
  const todayCount = bookings.filter((b) => new Date(b.created_date).toLocaleDateString("en-CA") === todayKey).length;
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const weekValue = bookings.filter((b) => new Date(b.created_date) >= weekAgo).reduce((s, b) => s + (Number(b.job_value) || 0), 0);
  const newCount = bookings.filter((b) => b.status === "new").length;
  const unassigned = bookings.filter(
    (b) => b.assignment_status === "unassigned" && !["completed", "cancelled"].includes(b.status)
  ).length;
  const mrr = clients.filter((c) => c.status === "active").reduce((s, c) => s + (Number(c.monthly_fee) || 0), 0);

  const gauges = [
    { icon: CalendarClock, label: "Bookings today", value: String(todayCount), sub: "Local time", glow: false },
    { icon: BellRing, label: "New (unactioned)", value: String(newCount), sub: "Need a call or confirm", glow: false },
    { icon: MapPinned, label: "Awaiting dispatch", value: String(unassigned), sub: "No partner assigned", glow: false },
    { icon: DollarSign, label: "Job value, last 7 days", value: money(weekValue), sub: "Across all cities", glow: true },
    { icon: Quote, label: "Open quote leads", value: quoteNew === null ? "—" : String(quoteNew), sub: "Quotes not yet answered", glow: false },
    { icon: Gauge, label: "White-label MRR", value: money(mrr), sub: "Active licensees", glow: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
      {gauges.map((g) => (
        <div key={g.label} className={panel}>
          <div className="holo-scan absolute top-0 left-0 right-0 h-px bg-[#1d9e56]/50" />
          <div className="flex items-center gap-2">
            <g.icon className="w-4 h-4 text-[#1d9e56]" />
            <div className={label}>{g.label}</div>
          </div>
          <div className={`text-3xl font-bold tracking-tight mt-3 tabular-nums ${g.glow ? "text-[#1d9e56] holo-glow-text" : "text-white"}`}>{g.value}</div>
          <div className="text-xs text-emerald-100/50 mt-1.5">{g.sub}</div>
        </div>
      ))}
      {quoteNew === null && <p className="col-span-full text-xs text-emerald-100/40">Live counters could not be refreshed — showing the latest available numbers.</p>}
    </div>
  );
}