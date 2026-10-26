import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

// The evidence and transparency layer: what each record type is, where it
// comes from, and what it never claims to be.
const LAYERS = [
  {
    t: "Verified customer service requests",
    d: "Quotes and pickup requests submitted through this platform. Real customer activity, counted directly — never modelled or inferred.",
  },
  {
    t: "Verified contractor service territories",
    d: "Cities where an active, verified contractor lists service. Coverage is recorded from partner records; a booking is confirmed per job, after a contractor accepts.",
  },
  {
    t: "External demand observations",
    d: "Public posts and forum records collected and summarized with attribution. Historical observations — dated and sourced, never presented as live searches.",
  },
  {
    t: "Search-interest measurements",
    d: "Relative interest indices from public measurement tools. A relative index is never equated with actual search counts, request volume or bookings.",
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-white border border-si-line">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-ri-charcoal">
          <ShieldCheck className="w-4 h-4 text-ri-emerald-ink" /> How this intelligence works
        </span>
        <ChevronDown className={`w-4 h-4 text-ri-slate transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-si-line px-4 py-4">
          <p className="text-xs leading-relaxed text-ri-slate">
            Every number on this page is a count of real records with a named source and a reporting window. Four kinds of evidence are always kept separate:
          </p>
          <ul className="mt-3 space-y-2.5">
            {LAYERS.map((l) => (
              <li key={l.t} className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ri-emerald" aria-hidden="true" />
                <div>
                  <div className="text-sm font-bold text-ri-charcoal">{l.t}</div>
                  <div className="text-xs leading-relaxed text-ri-slate">{l.d}</div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-ri-slate">
            When data is missing, displays show an honest empty state rather than an estimate. No platform traffic, search interest and contractor coverage are ever merged into one score.
          </p>
        </div>
      )}
    </div>
  );
}