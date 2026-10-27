import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

// Rex reads the same verified figures as the rest of the console and states
// what they mean together — demand where it is, coverage where it isn't.
export default function RexPanel({ total, topRow, verifiedCities, recruitingCities, periodLabel }) {
  const leader = topRow?.label || null;
  const sentence = !total
    ? "No verified observations in this window yet. As real requests, searches and public needs are recorded, this analysis fills in."
    : `Current demand signals show the strongest activity in ${leader ? `the ${leader.toLowerCase()} market` : "the furniture market"}, with ${total} verified records in the ${periodLabel}. ${
        verifiedCities < 5
          ? `Contractor coverage remains limited to ${verifiedCities} ${verifiedCities === 1 ? "city" : "cities"}, presenting an opportunity to recruit verified partners in high-demand regions.`
          : `Coverage spans ${verifiedCities} cities, with ${recruitingCities} still being recruited.`
      }`;

  const actions = [
    { label: "View opportunities", to: "/community" },
    { label: "Recruit contractors", to: "/contractors" },
    { label: "Optimize content", to: "/admin/seo" },
  ];

  return (
    <section className="console-panel flex h-full flex-col p-3.5">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--cn-teal)/0.16)]">
          <Sparkles className="h-3.5 w-3.5 text-cn-teal" />
        </span>
        <h2 className="font-heading text-[13.5px] font-bold text-cn-ink">Rex insight</h2>
      </div>

      <p className="mt-2 flex-1 text-[11.5px] leading-relaxed text-cn-muted">{sentence}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {actions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="rounded-lg border border-cn-line px-2.5 py-1.5 text-[10.5px] font-bold text-cn-ink transition-colors hover:border-cn-teal hover:text-cn-teal"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  );
}