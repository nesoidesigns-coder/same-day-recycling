import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw, Inbox, MapPin } from "lucide-react";
import useCoverageStatus from "@/hooks/useCoverageStatus";

// Simple, honest coverage section. Three clearly defined statuses, each only
// rendered when current system records support it — nothing is assumed or
// promised. Full details live on the Coverage page.
export default function CoverageStrip() {
  const cov = useCoverageStatus();
  if (!cov.loaded) return null;

  const recruiting = (cov.locations || [])
    .filter((l) => cov.statusFor(l.name) === "recruiting")
    .map((l) => l.name);

  const groups = [
    {
      icon: CheckCircle2,
      label: "Provider Available",
      note: "Verified contractor territory on file",
      cities: cov.verifiedCityNames,
      chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      icon: RefreshCw,
      label: "Contractor Matching",
      note: "Open requests being matched with contractors",
      cities: cov.matchingCityNames,
      chip: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      icon: Inbox,
      label: "Requests Accepted",
      note: "Accepting requests while recruiting local contractors",
      cities: recruiting,
      chip: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ].filter((g) => g.cities.length > 0);

  if (groups.length === 0) return null;

  const chipsFor = (cities) => cities.slice(0, 8);

  return (
    <section className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
        <div className="max-w-2xl mb-8">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Where we pick up
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A]">Local coverage, kept honest</h2>
          <p className="mt-2 text-slate-600">
            Statuses below come straight from verified platform records — a city only appears when the system can back it up.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => (
            <div key={g.label} className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-2">
                <g.icon className="w-5 h-5 text-[#187B65]" />
                <h3 className="font-bold text-[#102B2A]">{g.label}</h3>
                <span className="ml-auto text-xs font-bold text-slate-400">{g.cities.length}</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">{g.note}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {chipsFor(g.cities).map((c) => (
                  <span key={c} className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${g.chip}`}>
                    {c}
                  </span>
                ))}
                {g.cities.length > chipsFor(g.cities).length && (
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    +{g.cities.length - chipsFor(g.cities).length} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link to="/coverage" className="text-sm font-bold text-[#187B65] hover:underline">
            See full coverage details →
          </Link>
        </div>
      </div>
    </section>
  );
}