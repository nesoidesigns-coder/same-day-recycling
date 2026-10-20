import { base44 } from "@/api/base44Client";
import { Gauge, DollarSign, BellRing, MapPinned, CalendarClock, Quote } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

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
    { icon: CalendarClock, label: "Bookings today", value: String(todayCount), sub: "Vancouver time" },
    { icon: BellRing, label: "New (unactioned)", value: String(newCount), sub: "Need a call or confirm" },
    { icon: MapPinned, label: "Awaiting dispatch", value: String(unassigned), sub: "No partner assigned" },
    { icon: DollarSign, label: "Job value, last 7 days", value: money(weekValue), sub: "Across all cities" },
    { icon: Quote, label: "Open quote leads", value: quoteNew === null ? "—" : String(quoteNew), sub: "Quotes not yet answered" },
    { icon: Gauge, label: "White-label MRR", value: money(mrr), sub: "Active licensees" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
      {gauges.map((g) => (
        <div key={g.label} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <g.icon className="w-4 h-4 text-[#1d9e56]" />
            <div className="text-xs font-bold tracking-wide text-slate-500 uppercase">{g.label}</div>
          </div>
          <div className="text-2xl font-bold text-[#0c3b24] mt-2 tabular-nums">{g.value}</div>
          <div className="text-xs text-slate-500 mt-1">{g.sub}</div>
        </div>
      ))}
      {quoteNew === null && <p className="col-span-full text-xs text-slate-400">Live counters could not be refreshed — showing the latest available numbers.</p>}
    </div>
  );
}