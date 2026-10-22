import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Phone, Mail, MapPin, ChevronRight, ChevronLeft, Clock } from "lucide-react";

// Each source keeps its own status enum; SOURCES maps it onto shared board stages.
const SOURCES = [
  {
    entity: "QuoteLead", type: "Quote lead",
    nameField: (l) => l.name, cityField: "city",
    stages: ["new", "contacted", "quoted", "booked", "lost"],
    estimateField: (l) => l.estimate, contact: (l) => ({ phone: l.phone, email: l.email }),
  },
  {
    entity: "RealtorLead", type: "Realtor",
    nameField: (l) => l.agent_name, cityField: "city",
    stages: ["new", "contacted", "quoted", "booked", "closed"],
    estimateField: (l) => (l.quote_low ? `$${l.quote_low}\u2013$${l.quote_high}` : l.load_label), contact: (l) => ({ phone: l.phone, email: l.email }),
  },
  {
    entity: "SoftwareInquiry", type: "Software",
    nameField: (l) => l.company, cityField: null,
    stages: ["new", "contacted", "won", "lost"],
    contact: (l) => ({ phone: l.phone, email: l.email }),
  },
  {
    entity: "WhiteLabelLead", type: "White label",
    nameField: (l) => l.company || l.name, cityField: "city",
    stages: ["new", "contacted", "proposal_sent", "won", "lost"],
    contact: (l) => ({ phone: l.phone, email: l.email }),
  },
];

const COLUMNS = [
  { key: "new", label: "New", tone: "bg-sky-50 border-sky-200 text-sky-700" },
  { key: "contacted", label: "Contacted", tone: "bg-amber-50 border-amber-200 text-amber-700" },
  { key: "quoted", label: "Quoted", tone: "bg-violet-50 border-violet-200 text-violet-700" },
  { key: "booked", label: "Booked", tone: "bg-[#f4f7f5] border-[#187B65]/30 text-[#187B65]" },
  { key: "won", label: "Closed - Won", tone: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { key: "lost", label: "Lost", tone: "bg-slate-100 border-slate-200 text-slate-500" },
];

function daysSince(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function LeadCard({ card, source, onMove, busy }) {
  const stages = source.stages;
  const stageIndex = stages.indexOf(card.status);
  const age = daysSince(card.created_date);
  const stale = age >= 7 && !["won", "lost", "booked", "closed"].includes(card.status);
  return (
    <div className={`rounded-2xl bg-white border p-4 shadow-sm ${stale ? "border-amber-300" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-[#102B2A] leading-tight">{card.displayName}</div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{source.type}</span>
      </div>
      {card.city && (
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="w-3 h-3" />{card.city}</div>
      )}
      {card.estimate && <div className="mt-1 text-xs font-bold text-[#187B65]">{card.estimate}</div>}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {card.phone && <a href={`tel:${card.phone}`} className="flex items-center gap-1 text-slate-500 hover:text-[#187B65]"><Phone className="w-3 h-3" />{card.phone}</a>}
        {card.email && <a href={`mailto:${card.email}`} className="text-slate-500 hover:text-[#187B65] break-all">{card.email}</a>}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className={`flex items-center gap-1 text-[11px] font-semibold ${stale ? "text-amber-600" : "text-slate-400"}`}>
          <Clock className="w-3 h-3" />{age}d old
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={busy || stageIndex <= 0}
            onClick={() => onMove(card, source, stages[stageIndex - 1])}
            className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:text-[#102B2A] disabled:opacity-30"
            aria-label="Move back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={busy || stageIndex >= stages.length - 1}
            onClick={() => onMove(card, source, stages[stageIndex + 1])}
            className="rounded-lg bg-[#187B65] p-1 text-white hover:bg-[#125C4E] disabled:opacity-30"
            aria-label="Advance"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadPipelineBoard() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const pages = await Promise.all(SOURCES.map((s) => base44.entities[s.entity].filter({}, { sort: "-created_date", limit: 100 })));
    const all = [];
    pages.forEach((page, i) => {
      const source = SOURCES[i];
      page.items.forEach((l) => {
        all.push({
          ...l,
          source,
          displayName: source.nameField(l) || "(unnamed)",
          city: source.cityField ? l[source.cityField] : "",
          estimate: source.estimateField ? source.estimateField(l) : "",
          phone: source.contact(l).phone, email: source.contact(l).email,
        });
      });
    });
    setCards(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    cards.forEach((card) => {
      const normalized = card.source.stages.includes(card.status)
        ? (card.status === "closed" || card.status === "won" ? "won" : card.status === "proposal_sent" ? "quoted" : card.status)
        : "new";
      if (map[normalized]) map[normalized].push(card);
    });
    return map;
  }, [cards]);

  const onMove = async (card, source, nextStatus) => {
    setBusy(true);
    try {
      await base44.entities[source.entity].update(card.id, { status: nextStatus });
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c)));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-12" />;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <span className="text-sm font-semibold text-[#102B2A]">{cards.length} leads tracked</span>
        <button onClick={load} className="text-xs font-bold text-[#187B65] hover:underline">Refresh</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="w-64 md:w-72 shrink-0">
            <div className={`rounded-xl border px-3 py-2 flex items-center justify-between ${col.tone}`}>
              <span className="text-xs font-bold uppercase tracking-wide">{col.label}</span>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">{byStage[col.key].length}</span>
            </div>
            <div className="mt-3 space-y-3">
              {byStage[col.key].map((card) => (
                <LeadCard key={card.id} card={card} source={card.source} onMove={onMove} busy={busy} />
              ))}
              {byStage[col.key].length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}