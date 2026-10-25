import { Section, EmptyNote, money } from "./growthShared";

export default function CoverageTab({ data }) {
  const cities = data?.coverage || [];
  return (
    <Section title="Verified fulfillment capacity" note="Advertising eligibility follows verified contractor territories and actual capacity. Regions without verified capacity are never marketed as confirmable — and never advertised as same-day.">
      {cities.length === 0 ? (
        <EmptyNote>No verified contractor territories on record. Campaign activation requires verified capacity.</EmptyNote>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <div key={c.city} className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#102B2A]">{c.city}</p>
              <p className="mt-1 text-xs text-slate-500">
                {c.contractors} verified contractor(s) · {c.trucks} truck(s)/crew(s)
                {c.same_day_capable ? " · same-day capability confirmed" : " · no same-day capability on file"}
              </p>
              <p className="mt-2 text-xs text-slate-500">{c.partners.join(", ")}</p>
              <p className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${c.same_day_capable ? "bg-brand-softmint text-[#102B2A]" : "bg-slate-100 text-slate-600"}`}>
                {c.same_day_capable ? "Eligible for capacity-backed campaigns" : "Eligible — scheduled service messaging only"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}