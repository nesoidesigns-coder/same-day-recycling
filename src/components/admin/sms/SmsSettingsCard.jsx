import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Send, ShieldCheck, CircleOff, CheckCircle2, XCircle, Clock } from "lucide-react";

// Admin SMS connection panel: SMS is optional and fully dashboard-controlled.
// Nothing sends until the admin selects a provider and enters a verified
// sending number; outgoing texts queue in the meantime. No phone number is
// ever purchased, provisioned or replaced automatically.
export default function SmsSettingsCard({ onChanged }) {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("smsSend", { action: "status" });
      const s = res?.data || {};
      setStatus(s);
      setForm((cur) => cur || {
        provider: s.provider === "off" ? "off" : "twilio",
        from_number: s.from_number || "",
        outbound_enabled: s.outbound_enabled !== false,
        verified: !!s.verified,
      });
    } catch {
      setStatus({ error: "Couldn't load SMS status." });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const page = await base44.entities.SmsSettings.filter({}, { limit: 1 });
      const existing = (page?.items || [])[0];
      const payload = {
        provider: form.provider,
        from_number: String(form.from_number || "").trim(),
        outbound_enabled: form.outbound_enabled,
        verified: form.verified,
      };
      if (existing) await base44.entities.SmsSettings.update(existing.id, payload);
      else await base44.entities.SmsSettings.create(payload);
      await load();
      setMessage("SMS settings saved.");
      if (onChanged) onChanged();
    } catch {
      setMessage("Couldn't save settings.");
    } finally {
      setSaving(false);
    }
  };

  const flush = async () => {
    setFlushing(true);
    setMessage("");
    try {
      const res = await base44.functions.invoke("smsSend", { action: "flush_queue" });
      const r = res?.data || {};
      setMessage(r.ok ? `Queue flushed: ${r.sent} sent, ${r.failed} failed.` : (r.error || "Nothing sent — configure SMS first."));
      await load();
      if (onChanged) onChanged();
    } catch {
      setMessage("Couldn't flush the queue — configure SMS first.");
    } finally {
      setFlushing(false);
    }
  };

  const Row = ({ ok, label, detail }) => (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 className="w-4 h-4 text-[#187B65]" /> : <XCircle className="w-4 h-4 text-slate-300" />}
      <span className="text-slate-600">{label}</span>
      {detail && <span className="text-slate-500 text-xs">{detail}</span>}
    </div>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 font-bold text-[#102B2A]">
          {status?.ready ? <ShieldCheck className="w-5 h-5 text-[#187B65]" /> : status?.provider !== "off" ? <Clock className="w-5 h-5 text-gold-dark" /> : <CircleOff className="w-5 h-5 text-slate-500" />}
          SMS connection
        </div>
        <div className="text-xs font-bold uppercase tracking-wide">
          {!status ? "Checking…" : status.ready ? (
            <span className="text-[#187B65]">Ready — provider confirms each send</span>
          ) : status.provider !== "off" ? (
            <span className="text-amber-600">Incomplete — outbound texts are queued</span>
          ) : (
            <span className="text-slate-500">Off — outbound texts are queued</span>
          )}
        </div>
      </div>

      {status && !status.error && (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-4">
          <Row ok={status.account_sid_set} label="Twilio Account SID" detail={status.account_sid_set ? "(secret)" : "missing — add on Secrets page"} />
          <Row ok={status.auth_token_set} label="Twilio Auth Token" detail={status.auth_token_set ? "(secret)" : "missing — add on Secrets page"} />
          <Row ok={!!status.from_number} label="Sending number" detail={status.from_number ? `${status.from_number} (${status.from_number_source})` : "none yet"} />
          <Row ok={!!status.verified} label="Admin-verified number" detail={status.verified ? "confirmed" : "not confirmed"} />
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600">Queued messages: <strong className="text-[#102B2A]">{status.queued_count}</strong></span>
          </div>
          <div className="text-xs text-slate-500 self-center">Business contact line (604 Chatr) is never changed by SMS settings.</div>
        </div>
      )}

      {form && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Provider</span>
            <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="input py-2.5">
              <option value="off">Off — queue only (no texts send)</option>
              <option value="twilio">Twilio</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Sending number (E.164, e.g. +1604…)</span>
            <input value={form.from_number} onChange={(e) => setForm({ ...form, from_number: e.target.value })} className="input py-2.5" placeholder="+1604XXXXXXX" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.outbound_enabled} onChange={(e) => setForm({ ...form, outbound_enabled: e.target.checked })} className="w-4 h-4 accent-[#187B65]" />
            Outbound sending enabled
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="w-4 h-4 accent-[#187B65]" />
            I verified this number in the provider console
          </label>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={saving || !form} className="rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings
        </button>
        <button onClick={flush} disabled={flushing} className="rounded-full border border-slate-200 text-[#102B2A] font-bold px-5 py-2.5 text-sm hover:border-[#187B65] transition-colors disabled:opacity-60 flex items-center gap-2">
          {flushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Flush queue
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </div>
  );
}