import { LAYER_HEX } from "@/lib/canadaOutline";

const LEGEND = [["verified", "Verified territory"], ["demand", "Public service posts"], ["ai", "AI finding"], ["matching", "Contractor matching"], ["selected", "Selected"], ["recruiting", "Recruitment / unchecked"]];
export default function HeroNetworkHeader({ coverage, demand }) {
  return (
    <header className="border-b border-market-line px-4 py-4">
      <h2 className="font-heading text-lg font-bold text-market-ink">Canadian service network</h2>
      <p className="mt-1 text-sm leading-relaxed text-market-muted">Explore a city. A verified territory is not a confirmed pickup window.</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-market-ink">
        <div><dt className="text-xs text-market-muted">Contractors</dt><dd className="mt-1 text-xl font-bold">{coverage.loaded ? coverage.totals?.contractors ?? "—" : "—"}</dd></div>
        <div><dt className="text-xs text-market-muted">Territories</dt><dd className="mt-1 text-xl font-bold">{coverage.loaded ? coverage.verifiedCityNames.length : "—"}</dd></div>
        <div><dt className="text-xs text-market-muted">Open posts</dt><dd className="mt-1 text-xl font-bold">{demand.data?.total ?? "—"}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND.map(([key, label]) => <span key={key} className="inline-flex items-center gap-2 text-xs font-medium text-market-ink"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: LAYER_HEX[key] }} />{label}</span>)}
      </div>
      <p className="mt-3 text-xs text-market-muted">AI findings are not connected to this map yet; no AI activity is implied.</p>
    </header>
  );
}