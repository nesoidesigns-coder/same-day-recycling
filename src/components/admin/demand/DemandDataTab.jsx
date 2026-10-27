import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Filter, Download } from "lucide-react";
import { CATEGORY_LABELS, PROVINCES } from "@/lib/demandShared";

const MEASURE_OPTIONS = [
  ["monthly_volume", "Monthly volume estimate"],
  ["monthly_average", "12-month rolling average"],
  ["relative_interest", "Trends index (0-100)"],
  ["unspecified_estimate", "Unspecified estimate"],
];

// Industry Data: browse, add and remove source-labeled demand observations,
// with measure-type labeling so averages and indices are never mixed into
// monthly sums.
export default function DemandDataTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ keyword: "", category: "junk_removal", geo_type: "province", province: "BC", city: "", volume: "", period: "", source: "", source_url: "", methodology_note: "", search_engine: "google", comparison_group: "", metric_type: "monthly_volume", competition: "unknown", trend_direction: "unknown", close_variants: "" });
  const [filterText, setFilterText] = useState("");

  // Export exactly what is on screen — source-labeled rows, no aggregation and
  // no derived columns, so the file can be audited against its provider.
  const exportCsv = () => {
    const cols = ["keyword", "service_category", "geo_type", "geo_key", "city", "province_code", "period", "metric_type", "est_monthly_volume", "volume_basis", "source", "competition", "last_updated"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...filtered.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `demand-observations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const [filterMeasure, setFilterMeasure] = useState("all");

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
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.period) || !form.source.trim() || !/^https:\/\//.test(form.source_url) || !form.methodology_note.trim()) { setMessage('Supply the real reporting month, original source label, source URL and methodology.'); return; }
    if (form.volume === '' || !Number.isFinite(Number(form.volume)) || Number(form.volume) < 0 || (form.metric_type === 'relative_interest' && (Number(form.volume) > 100 || !form.comparison_group.trim()))) { setMessage('Supply a source value; indices need a 0–100 value and their comparison window.'); return; }
    if (form.geo_type === 'city' && !form.city.trim()) { setMessage('City is required.'); return; }
    setSaving(true);
    setMessage("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const period = /^\d{4}-\d{2}$/.test(form.period.trim()) ? form.period.trim() : today.slice(0, 7);
      const isIndex = form.metric_type === "relative_interest";
      const variants = form.close_variants.split(",").map((v) => v.trim()).filter(Boolean);
      await base44.entities.DemandObservation.create({
        geo_type: form.geo_type,
        geo_key: form.geo_type === "city" ? form.city.trim() : form.geo_type === "province" ? form.province : "CA",
        province_code: form.geo_type !== 'national' ? form.province : '',
        search_engine: form.metric_type === 'relative_interest' ? 'google' : form.search_engine,
        provider: form.metric_type === 'relative_interest' ? 'google_trends' : 'manual',
        country_code: 'CA',
        source_url: form.source_url.trim(),
        comparison_group: form.comparison_group.trim(),
        retrieved_at: new Date().toISOString(),
        city: form.geo_type === "city" ? form.city.trim() : "",
        service_category: form.category,
        keyword: form.keyword.trim(),
        close_variants: variants,
        period,
        est_monthly_volume: isIndex ? 0 : Number(form.volume) || 0,
        volume_basis: isIndex ? 'google_trends' : 'admin_import',
        metric_type: form.metric_type,
        trend_index: isIndex ? Number(form.volume) || 0 : 0,
        competition: form.competition,
        trend_direction: form.trend_direction,
        source: form.source.trim(),
        methodology_note: `Admin-recorded source observation. ${form.methodology_note.trim()}`.slice(0,1000),
        last_updated: today,
      });
      setForm({ ...form, keyword: "", volume: "", source: "", close_variants: "" });
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

  const filtered = useMemo(() => rows.filter((r) =>
    (!filterText || String(r.keyword || "").toLowerCase().includes(filterText.toLowerCase())) &&
    (filterMeasure === "all" || (r.metric_type || "unspecified_estimate") === filterMeasure)
  ), [rows, filterText, filterMeasure]);

  return (
    <div>
      <h2 className="font-extrabold text-[#102B2A] text-lg mb-1">Industry Demand Database</h2>
      <p className="text-sm text-slate-500 mb-5">
        Every row is a source-labeled, dated search-volume estimate. One row per keyword + geography + period — overlapping
        keyword variants are merged into their canonical keyword to prevent double-counting. Monthly values, rolling
        averages and Trends indices are stored with their own measure type and never summed together.
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
          <Select value={form.metric_type} onValueChange={(v) => setForm({ ...form, metric_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEASURE_OPTIONS.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
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
          {form.geo_type !== 'national' && (
            <Select value={form.province} onValueChange={(v) => setForm({ ...form, province: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVINCES.map(([c, n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {form.geo_type === "city" && (
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          )}
          <Input type="number" placeholder={form.metric_type === "relative_interest" ? "Trends index (0-100)" : "Est. monthly volume"} value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
          <Input placeholder="Source reporting month (YYYY-MM)" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          <Input placeholder="Original source label (required)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <Input placeholder="Source URL (https://)" value={form.source_url} onChange={(e) => setForm({...form,source_url:e.target.value})}/>
          <Input placeholder="Source methodology and coverage" value={form.methodology_note} onChange={(e) => setForm({...form,methodology_note:e.target.value})}/>
          <Select value={form.search_engine} onValueChange={(v) => setForm({...form,search_engine:v})}><SelectTrigger aria-label="Search engine"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="google">Google</SelectItem><SelectItem value="bing">Bing</SelectItem></SelectContent></Select>
          {form.metric_type === 'relative_interest' && <Input placeholder="Original Trends comparison window" value={form.comparison_group} onChange={(e) => setForm({...form,comparison_group:e.target.value})}/>}
          <Input placeholder="Close variants (comma-separated, optional)" value={form.close_variants} onChange={(e) => setForm({ ...form, close_variants: e.target.value })} />
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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
          <Filter className="w-3.5 h-3.5 text-[#187B65]" /> Filters
        </div>
        <Input className="max-w-[220px]" placeholder="Filter by keyword" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
        <Select value={filterMeasure} onValueChange={setFilterMeasure}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All measure types</SelectItem>
            {MEASURE_OPTIONS.map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV ({filtered.length})
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-500"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading observations…</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No observations match. Add one above or import a Keyword Planner export.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-sm bg-white">
            <thead className="bg-[#f6f9f8] text-left">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Keyword</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Service</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Geo</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Period</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Measure</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Value</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Source</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Updated</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2.5 font-semibold text-[#102B2A] max-w-[240px] truncate" title={r.keyword}>{r.keyword}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{CATEGORY_LABELS[r.service_category] || r.service_category}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{r.geo_type === "national" ? "Canada" : r.geo_type === "province" ? r.province_code : r.city}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{r.period}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">{MEASURE_OPTIONS.find(([v]) => v === (r.metric_type || "unspecified_estimate"))?.[1] || "Estimate"}</td>
                  <td className="px-3 py-2.5 font-bold text-[#102B2A] tabular-nums">{(r.metric_type || "") === "relative_interest" ? `index ${r.trend_index || 0}` : Number(r.est_monthly_volume || 0).toLocaleString("en-CA")}</td>
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