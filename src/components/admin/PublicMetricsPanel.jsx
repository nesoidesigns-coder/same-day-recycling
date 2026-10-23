import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, RefreshCw, Save, ShieldCheck, Eye } from "lucide-react";

const METRICS = [
  { key: "service_inquiries", label: "Service Inquiries", source: "Quote calculator leads + nationwide service requests (record_type = service). Internal-test fixtures excluded." },
  { key: "unique_customers", label: "Unique Customers", source: "Distinct normalized phone/email across inquiries and service bookings in the period." },
  { key: "pickup_requests", label: "Pickup Requests", source: "Booking records created in the period (record_type = service)." },
  { key: "confirmed_bookings", label: "Confirmed Bookings", source: "Service bookings in a confirmed-or-later status (confirmed / contacted / scheduled / completed)." },
  { key: "completed_pickups", label: "Completed Pickups", source: "Service bookings with status completed." },
  { key: "available_contractors", label: "Available Contractors", source: "Partner records with active = true, excluding internal test contractors. Capacity target supported.", target: true },
  { key: "verified_service_areas", label: "Verified Service Areas", source: "Distinct cities with at least one active, verified, non-test contractor. Capacity target supported.", target: true },
];

// Public Metrics — System Administration controls for the homepage Recycling
// Pulse. The owner can show/hide each public metric and set operational
// capacity targets (gauge progress only). Verified totals always come from
// operational records and can never be inflated manually.
export default function PublicMetricsPanel() {
  const [record, setRecord] = useState(null);
  const [enabled, setEnabled] = useState({});
  const [targets, setTargets] = useState({});
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.PublicMetricSettings.list({ limit: 1 });
        const rec = (items || [])[0] || null;
        setRecord(rec);
        setEnabled(rec?.metrics_enabled || {});
        setTargets(rec?.targets || {});
        await verify();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const verify = async () => {
    setVerifying(true);
    try {
      const res = await base44.functions.invoke("publicPulse", { period: "30d" });
      setAudit(res.data || null);
    } catch (e) {
      setAudit(null);
    } finally {
      setVerifying(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { metrics_enabled: enabled, targets };
      if (record) {
        const updated = await base44.entities.PublicMetricSettings.update(record.id, payload);
        setRecord(updated);
      } else {
        const created = await base44.entities.PublicMetricSettings.create(payload);
        setRecord(created);
      }
      setSavedAt(new Date());
      await verify();
    } finally {
      setSaving(false);
    }
  };

  const setTarget = (key, raw) => {
    const n = parseInt(raw, 10);
    setTargets((t) => ({ ...t, [key]: Number.isFinite(n) && n > 0 ? n : null }));
  };

  const value = (key) => audit?.metrics?.[key];

  return (
    <div className="mt-10 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#102B2A] flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#187B65]" /> Public Metrics
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Controls the homepage Canada's Recycling Pulse dashboard. Verified totals come only from operational
            records and can never be inflated manually — you control visibility and capacity targets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={verify} disabled={verifying} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} /> Verify accuracy
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2 bg-[#187B65] hover:bg-[#125C4E]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </Button>
        </div>
      </div>
      {savedAt && <p className="mt-2 text-xs font-semibold text-[#187B65]">Saved — the public dashboard reflects these settings on its next refresh.</p>}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading public metrics settings…
        </div>
      ) : (
        <>
          <div className="mt-5 divide-y divide-slate-100">
            {METRICS.map((metric) => (
              <div key={metric.key} className="py-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="md:w-72">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#102B2A] text-sm">{metric.label}</span>
                    {metric.target && <span className="rounded-full bg-[#187B65]/10 px-2 py-0.5 text-[10px] font-bold text-[#187B65] uppercase">target</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{metric.source}</p>
                </div>
                <div className="flex items-center gap-2 md:ml-4">
                  <Switch
                    checked={enabled[metric.key] !== false}
                    onCheckedChange={(v) => setEnabled((e) => ({ ...e, [metric.key]: v }))}
                    aria-label={`Show ${metric.label} publicly`}
                  />
                  <span className="text-xs font-semibold text-slate-600">{enabled[metric.key] === false ? "Hidden" : "Public"}</span>
                </div>
                {metric.target && (
                  <div className="flex items-center gap-2 md:ml-auto">
                    <label className="text-xs font-semibold text-slate-500" htmlFor={`target-${metric.key}`}>Capacity target</label>
                    <Input
                      id={`target-${metric.key}`}
                      type="number"
                      min="1"
                      className="w-24 h-9"
                      value={targets[metric.key] ?? ""}
                      onChange={(e) => setTarget(metric.key, e.target.value)}
                      placeholder="—"
                    />
                  </div>
                )}
                <div className="md:ml-4 md:text-right text-xs text-slate-600 md:w-40">
                  <span className="font-bold text-[#102B2A]">{value(metric.key)?.value ?? "—"}</span> now
                  {value(metric.key)?.prev != null && <span className="text-slate-400"> · prev {value(metric.key).prev}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-[#f4f7f5] border border-slate-100 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A] mb-2">
              <ShieldCheck className="w-4 h-4 text-[#187B65]" /> Calculation accuracy review (30-day window)
            </div>
            {audit ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                    <div className="font-bold text-[#102B2A]">{audit.audit?.excluded?.internal_test_national_requests ?? 0}</div>
                    <div className="text-slate-500">test requests excluded</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                    <div className="font-bold text-[#102B2A]">{audit.audit?.excluded?.internal_test_bookings ?? 0}</div>
                    <div className="text-slate-500">test bookings excluded</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                    <div className="font-bold text-[#102B2A]">{audit.audit?.excluded?.internal_test_partners ?? 0}</div>
                    <div className="text-slate-500">test contractors excluded</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                    <div className="font-bold text-[#102B2A]">{audit.audit?.excluded?.cancelled_service_bookings ?? 0}</div>
                    <div className="text-slate-500">cancelled jobs excluded</div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  All-time verified totals: {audit.audit?.totals_all_time?.service_inquiries ?? 0} inquiries ·{" "}
                  {audit.audit?.totals_all_time?.pickup_requests ?? 0} pickup requests ·{" "}
                  {audit.audit?.totals_all_time?.available_contractors ?? 0} active contractors. Refreshed{" "}
                  {new Date(audit.refreshed_at).toLocaleTimeString("en-CA")}.
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">Accuracy review unavailable right now — the metrics function could not be reached.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}