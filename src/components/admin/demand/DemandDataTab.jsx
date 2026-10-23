import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { CATEGORY_LABELS, PROVINCES } from "@/lib/demandShared";

// Industry Data: browse, add and remove source-labeled demand observations.
export default function DemandDataTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ keyword: "", category: "junk_removal", geo_type: "province", province: "BC", city: "", volume: "", period: "", source: "", competition: "unknown", trend_direction: "unknown" });

  const load = async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.DemandObservation.filter({}, { sort: "-created_date", limit: 200 });
      setRows(items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.keyword.trim()) { setMessage("Keyword is required."); return; }
    setSaving(true);
    setMessage("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const period = /^\d{4}-\d{2}$/.test(form.period.trim()) ? form.period.trim() : today.slice(0, 7);
      await base44.entities.DemandObservation.create({
        geo_type: form.geo_type,
        geo_key: form.geo_type === "city" ? form.city.trim() : form.geo_type === "province" ? form.province : "CA",
        province_code: form.geo_type === "province" ? form.province : "",
        city: form.geo_type === "city" ? form.city.trim() : "",
        service_category: form.category,
        keyword: form.keyword.trim(),
        period,
        est_monthly_volume: Number(form.volume) || 0,
        volume_basis: "keyword_planner",
        competition: form.competition,
        trend_direction: form.trend_direction,
        source: form.source.trim() || "Google Ads Keyword Planner (manual entry)",
        methodology_note: `Manually recorded ${today} from a verified Keyword Planner lookup by the owner.`,
        last_updated: today,
      });
      setForm({ ...form, keyword: "", volume: "", source: "" });
      setMessage("Observation recorded.");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.DemandObservation.delete(id);
    await load();
  };

  return (
    <div>
      <h2 className="font-extrabold text-[#102B2A] text-lg mb-1">Industry Demand Database</h2>
      <p className="text-sm text-slate-500 mb-5">
        Every row is a source-labeled, dated search-volume estimate. One row per keyword + geography + period — overlapping
        keyword variants are merged into their canonical keyword to prevent double-counting.
      </p>

      <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-4 mb-6">
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3">Add observation (e.g. from a Keyword Planner lookup)</div>
        <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Input placeholder="Keyword" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.geo_type} onValueChange={(v) => setForm({ ...form, geo_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="national">National</SelectItem>
              <SelectItem value="province">Province</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>
          {form.geo_type === "province" && (
            <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVINCES.map(([c, n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {form.geo_type === "city" && (
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          )}
          <Input type="number" placeholder="Est. monthly volume" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
          <Input placeholder="Period (YYYY-MM, blank = current)" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          <Input placeholder="Source label" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <Select value={form.competition} onValueChange={(v) => setForm({ ...form, competition: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unknown">Competition: unknown</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Button onClick={add} disabled={saving} className="gap-2 bg-[#187B65] hover:bg-[#125C4E]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add observation
          </Button>
          {message && <span className="text-xs font-semibold text-[#187B65]">{message}</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading observations…</div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No observations yet. Add one above or import a Keyword Planner export.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-sm bg-white">
            <thead className="bg-[#f6f9f8] text-left">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Keyword</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Service</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Geo</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Period</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Volume</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Source</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Updated</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2.5 font-semibold text-[#102B2A] max-w-[240px] truncate" title={r.keyword}>{r.keyword}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{CATEGORY_LABELS[r.service_category] || r.service_category}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{r.geo_type === "national" ? "Canada" : r.geo_type === "province" ? r.province_code : r.city}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{r.period}</td>
                  <td className="px-3 py-2.5 font-bold text-[#102B2A] tabular-nums">{Number(r.est_monthly_volume || 0).toLocaleString("en-CA")}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[180px] truncate" title={r.source}>{r.source}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{r.last_updated}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => remove(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" aria-label="Delete observation">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}