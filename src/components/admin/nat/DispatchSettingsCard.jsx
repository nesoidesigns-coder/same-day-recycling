import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Settings2 } from "lucide-react";

// Configures the auto-dispatch response window and escalation behaviour.
export default function DispatchSettingsCard() {
  const [settings, setSettings] = useState(null);
  const [edit, setEdit] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const page = await base44.entities.DispatchSettings.filter({}, { limit: 1 });
    const s = (page.items || page)[0] || null;
    setSettings(s);
    setEdit(s ? {
      response_window_minutes: s.response_window_minutes ?? 45,
      max_offers_per_round: s.max_offers_per_round ?? 3,
      auto_escalate: s.auto_escalate !== false,
      admin_email: s.admin_email || "samedayrecycling@gmail.com",
    } : { response_window_minutes: 45, max_offers_per_round: 3, auto_escalate: true, admin_email: "samedayrecycling@gmail.com" });
  };

  useEffect(() => { load().catch(() => setSettings(false)); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        response_window_minutes: Number(edit.response_window_minutes) || 45,
        max_offers_per_round: Number(edit.max_offers_per_round) || 3,
        auto_escalate: !!edit.auto_escalate,
        admin_email: String(edit.admin_email || "").trim() || "samedayrecycling@gmail.com",
      };
      if (settings && settings.id) await base44.entities.DispatchSettings.update(settings.id, payload);
      else await base44.entities.DispatchSettings.create(payload);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 mb-4 flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A] mr-2">
        <Settings2 className="w-4 h-4 text-[#187B65]" /> Auto-dispatch settings
      </div>
      <label className="block">
        <span className="block text-[11px] font-semibold text-slate-500 mb-1">Response window (minutes)</span>
        <input type="number" min="5" value={edit.response_window_minutes ?? ""} onChange={(e) => setEdit((p) => ({ ...p, response_window_minutes: e.target.value }))} className="input text-sm w-36" />
      </label>
      <label className="block">
        <span className="block text-[11px] font-semibold text-slate-500 mb-1">Offers per wave</span>
        <input type="number" min="1" value={edit.max_offers_per_round ?? ""} onChange={(e) => setEdit((p) => ({ ...p, max_offers_per_round: e.target.value }))} className="input text-sm w-28" />
      </label>
      <label className="block">
        <span className="block text-[11px] font-semibold text-slate-500 mb-1">Admin alert email</span>
        <input value={edit.admin_email ?? ""} onChange={(e) => setEdit((p) => ({ ...p, admin_email: e.target.value }))} className="input text-sm w-64" />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 pb-2.5">
        <input type="checkbox" checked={edit.auto_escalate !== false} onChange={(e) => setEdit((p) => ({ ...p, auto_escalate: e.target.checked }))} />
        Auto-escalate expired offers
      </label>
      <button onClick={save} disabled={saving} className="rounded-full bg-[#187B65] text-[#102B2A] text-xs font-bold px-4 py-2.5 hover:bg-[#125C4E] flex items-center gap-1.5">
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
      </button>
    </div>
  );
}