import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Phone, MapPin, Mail, Sparkles, Copy, Check } from "lucide-react";
import { CITIES } from "@/lib/cities";

const STATUSES = ["new", "contacted", "quoted", "booked", "closed"];

export default function LeadsTab() {
  const [cityFilter, setCityFilter] = useState("");
  const [leads, setLeads] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);

  const query = cityFilter ? { city: cityFilter } : {};

  const load = async (reset) => {
    setLoading(true);
    const opts = { sort: "-created_date", limit: 50 };
    if (!reset && cursor) opts.cursor = cursor;
    const page = await base44.entities.RealtorLead.filter(query, opts);
    setLeads(reset ? page.items : [...leads, ...page.items]);
    setCursor(page.next_cursor);
    setLoading(false);
  };

  useEffect(() => {
    setCursor(null);
    load(true);
  }, [cityFilter]);

  const setStatus = async (lead, status) => {
    await base44.entities.RealtorLead.update(lead.id, { status });
    load(true);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-semibold text-[#102B2A]">Filter by city</span>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input w-48 py-2">
          <option value="">All cities</option>
          {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      {loading && !leads.length ? (
        <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-12" />
      ) : leads.length === 0 ? (
        <p className="text-slate-500 text-center py-12">No leads yet — realtor submissions from /real-estate appear here.</p>
      ) : (
        <div className="space-y-4">
          {leads.map((l) => (
            <div key={l.id} className="rounded-3xl bg-white border border-slate-100 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#102B2A]">{l.agent_name}</span>
                    {l.brokerage && <span className="rounded-full bg-slate-100 text-slate-600 px-3 py-1 text-xs font-bold">{l.brokerage}</span>}
                    <a href={`tel:${l.phone}`} className="flex items-center gap-1 text-sm text-[#187B65] font-semibold"><Phone className="w-3.5 h-3.5" />{l.phone}</a>
                    <a href={`mailto:${l.email}`} className="flex items-center gap-1 text-sm text-slate-500 font-semibold"><Mail className="w-3.5 h-3.5" />{l.email}</a>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin className="w-3.5 h-3.5" />{l.city || "—"}</span>
                    <select
                      value={l.status || "new"}
                      onChange={(e) => setStatus(l, e.target.value)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-[#102B2A] capitalize"
                      aria-label="Lead status"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 max-w-xl">{l.property_address}</p>
                  {l.items_description && <p className="text-sm text-slate-500 mt-1">{l.items_description}</p>}
                  <p className="text-xs text-slate-400 mt-1">Preferred date: {l.preferred_date || "any"}</p>
                  {(l.ai_reply || l.quote_low) && (
                    <AiBlock lead={l} />
                  )}
                </div>
              </div>
            </div>
          ))}
          {cursor && (
            <button onClick={() => load(false)} disabled={loading} className="w-full rounded-full bg-white border border-slate-200 text-[#102B2A] font-bold px-6 py-3 hover:border-[#187B65] transition-colors disabled:opacity-60">
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AiBlock({ lead }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lead.ai_reply || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <div className="mt-3 rounded-2xl bg-[#f4f7f5] p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="w-4 h-4 text-[#187B65]" />
        <span className="text-xs font-bold text-[#102B2A]">AI processed</span>
        {lead.quote_low ? (
          <span className="rounded-full bg-[#187B65]/15 px-3 py-1 text-xs font-bold text-[#102B2A]">
            ${Number(lead.quote_low).toLocaleString()} – ${Number(lead.quote_high).toLocaleString()} · {lead.load_label || "estimate"}
          </span>
        ) : null}
        {lead.ai_reply && (
          <button onClick={copy} className="ml-auto flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-[#102B2A] hover:border-[#187B65] transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-[#187B65]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy reply"}
          </button>
        )}
      </div>
      {lead.ai_reply && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{lead.ai_reply}</p>}
    </div>
  );
}