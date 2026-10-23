import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Mail, CreditCard, Users, Truck, AlertTriangle, Loader2 } from "lucide-react";
import SystemsStatusTable from "@/components/admin/SystemsStatusTable";

const num = (n) => (n === null || n === undefined ? "—" : n);

export default function HealthPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('systemHealth', {});
        setData(res?.data || null);
      } catch (e) {
        setError((e && e.message) || "Health check failed");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800 mb-6 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking system health…
      </div>
    );
  }

  const pay = data.payments || {};
  const contractors = data.contractors || {};
  const dispatch = data.dispatch || {};
  const email = data.email || {};

  const blocks = [
    {
      title: "Payments", icon: CreditCard,
      rows: [
        ["PayPal mode", pay.mode || "unknown"],
        ["Credentials configured", pay.configured ? "Yes" : "No — set PAYPAL_MODE, PAYPAL_CLIENT_ID, PAYPAL_SECRET"],
        ["Transactions", `paid ${num(pay.transactions?.paid)} · created ${num(pay.transactions?.created)} · failed ${num(pay.transactions?.failed)} · refunded ${num(pay.transactions?.refunded)}`],
        ["Unhandled webhook events", pay.unhandled_webhook_events ?? "—"],
      ],
    },
    {
      title: "Email delivery", icon: Mail,
      rows: [
        ["Engine", email.engine || "—"],
        ["Recent sends", (email.recent_sends || []).length],
        ["Recent customer failures", email.recent_customer_failures ?? 0],
        ["Last sends", (email.recent_sends || []).slice(0, 3).map((s) => `${s.booking}: owner ${s.owner} / customer ${s.customer}`).join(" · ") || "No bookings yet"],
      ],
    },
    {
      title: "Contractor availability", icon: Users,
      rows: [
        ["Active partners", contractors.active_partners ?? "—"],
        ["Verified recruits", contractors.verified_recruits ?? "—"],
        ["Pending applications", contractors.pending_applications ?? "—"],
      ],
    },
    {
      title: "Dispatch", icon: Truck,
      rows: [
        ["Pending requests (awaiting contractor)", dispatch.pending_requests ?? "—"],
        ["Dispatch failures (unable to fulfill)", dispatch.failures ?? "—"],
      ],
    },
  ];

  {data.systems?.length > 0 && <SystemsStatusTable systems={data.systems} />}

  const alert = (dispatch.pending_requests > 0 && (contractors.active_partners || 0) + (contractors.verified_recruits || 0) === 0)
    ? "No verified contractors in the network while requests are waiting — onboard contractors in the dispatch center."
    : "";

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#187B65]" />
        <h2 className="text-lg font-bold text-[#102B2A]">Live health snapshot</h2>
        <span className="ml-auto text-xs text-slate-400">Checked {String(data.checked_at || "").slice(0, 16).replace("T", " ")}</span>
      </div>
      {alert && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {alert}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {blocks.map((b) => (
          <div key={b.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <b.icon className="w-4 h-4 text-[#187B65]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{b.title}</span>
            </div>
            <div className="space-y-2 text-sm">
              {b.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-[#102B2A] text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}