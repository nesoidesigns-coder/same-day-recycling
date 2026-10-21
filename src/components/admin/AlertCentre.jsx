import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Star, Users, CalendarClock, MapPin } from "lucide-react";

const SEVERITY = {
  high: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50", label: "High" },
  medium: { dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", label: "Medium" },
  low: { dot: "bg-sky-500", text: "text-sky-600", bg: "bg-sky-50", label: "Low" },
};

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function AlertCentre({ bookings, partners, reviewPending }) {
  const today = new Date().toISOString().slice(0, 10);
  const ACTIVE = ["new", "confirmed", "scheduled"];
  const alerts = [];

  const active = bookings.filter((b) => ACTIVE.includes(b.status || "new"));
  const unassigned = active.filter((b) => ["unassigned", "declined", undefined, null, ""].includes(b.assignment_status));
  if (unassigned.length) {
    alerts.push({
      severity: "high",
      icon: MapPin,
      title: `${unassigned.length} job${unassigned.length === 1 ? "" : "s"} awaiting assignment`,
      detail: unassigned.map((b) => b.city || "unknown city").filter((c, i, a) => a.indexOf(c) === i).slice(0, 4).join(", "),
      time: unassigned[0]?.created_date,
      action: { label: "Open dispatch", to: "/admin/jobs" },
    });
  }

  const overdue = active.filter((b) => b.preferred_date && b.preferred_date < today && b.status !== "new");
  if (overdue.length) {
    alerts.push({
      severity: "high",
      icon: CalendarClock,
      title: `${overdue.length} overdue job${overdue.length === 1 ? "" : "s"} (past service date)`,
      detail: overdue.map((b) => `${b.name || "Customer"} · ${b.preferred_date}`).slice(0, 3).join(" | "),
      time: overdue[0]?.preferred_date,
      action: { label: "Reschedule in dispatch", to: "/admin/jobs" },
    });
  }

  const unpaid = bookings.filter((b) => b.status === "completed" && (b.assignment_status || "") === "completed" && !b.payout_paid);
  const unpaidTotal = unpaid.reduce((s, b) => s + (Number(b.job_value) || 0) * 0.75, 0);
  if (unpaid.length) {
    alerts.push({
      severity: "medium",
      icon: CircleDollarSign,
      title: `${money(unpaidTotal)} in pending partner payouts`,
      detail: `${unpaid.length} completed job${unpaid.length === 1 ? "" : "s"} awaiting payout`,
      time: unpaid[0]?.created_date,
      action: { label: "Review payouts", to: "/admin/payouts" },
    });
  }

  const incomplete = (partners || []).filter((p) => !p.city || !p.email);
  if (incomplete.length) {
    alerts.push({
      severity: "low",
      icon: Users,
      title: `${incomplete.length} partner profile${incomplete.length === 1 ? "" : "s"} incomplete`,
      detail: incomplete.map((p) => p.name).slice(0, 3).join(", "),
      time: incomplete[0]?.created_date,
      action: { label: "Fix in partners", to: "/admin/partners" },
    });
  }

  if (reviewPending > 0) {
    alerts.push({
      severity: "low",
      icon: Star,
      title: `${reviewPending} review${reviewPending === 1 ? "" : "s"} awaiting approval`,
      detail: "Submitted reviews need approval before going live.",
      time: null,
      action: { label: "Moderate reviews", to: "/admin/reviews" },
    });
  }

  const order = { high: 0, medium: 1, low: 2 };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-[#187B65]" />
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A]">Needs attention</h2>
      </div>
      {alerts.length === 0 ? (
        <div className="flex items-center gap-2 py-3 text-sm font-semibold text-[#187B65]">
          <CheckCircle2 className="w-4 h-4" /> All clear — no open operational alerts.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {alerts.sort((a, b) => order[a.severity] - order[b.severity]).map((a, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 py-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${SEVERITY[a.severity].dot}`} aria-label={SEVERITY[a.severity].label} />
              <a.icon className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-40">
                <div className="text-sm font-bold text-[#102B2A]">{a.title}</div>
                {a.detail && <div className="text-xs text-slate-500">{a.detail}</div>}
              </div>
              <Link to={a.action.to} className={`rounded-full ${SEVERITY[a.severity].bg} ${SEVERITY[a.severity].text} px-3 py-1.5 text-xs font-bold hover:brightness-95 transition`}>
                {a.action.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}