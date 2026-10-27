import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

// Rex, stated plainly: what the window means, then the three moves it enables.
// The copy is assembled from the same verified counts the dashboard shows — it
// is guidance, never a claim about demand that was not observed.
export default function RexInsight({ total, topRow, selectedRow, verifiedCities, recruitingCities, periodLabel }) {
  const focus = selectedRow || topRow;
  const text = total
    ? `Across ${periodLabel.toLowerCase()} the network recorded ${total} verified observation${total === 1 ? "" : "s"}${
        focus ? `, with ${focus.label || focus.key} leading at ${focus.count}` : ""
      }. ${verifiedCities} cit${verifiedCities === 1 ? "y has" : "ies have"} verified contractor coverage today${
        recruitingCities ? `, while ${recruitingCities} ${recruitingCities === 1 ? "is" : "are"} open for contractor recruitment` : ""
      }. Records labelled search interest are kept separate from requests and bookings.`
    : "No verified observations exist for this selection yet. Widen the window or clear the region filter and the radar will fill as records arrive.";

  return (
    <div className="rounded-2xl border border-lm-line bg-lm-surface p-4 shadow-[0_1px_2px_rgba(18,61,55,0.04)]">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[hsl(var(--lm-teal)/0.12)]">
          <Sparkles className="h-3.5 w-3.5 text-lm-teal" />
        </span>
        <h2 className="font-heading text-sm font-bold text-lm-ink">Rex insight</h2>
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-lm-muted">{text}</p>
      <Link to="/demand" className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-bold text-lm-teal hover:underline">
        Run full analysis <ArrowRight className="h-3 w-3" />
      </Link>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[
          { to: "/community", label: "View opportunities" },
          { to: "/contractors", label: "Recruit contractors" },
          { to: "/services", label: "Optimize content" },
        ].map((b) => (
          <Link
            key={b.to}
            to={b.to}
            className="rounded-lg border border-lm-line px-1.5 py-2 text-center text-[10.5px] font-semibold leading-tight text-lm-ink transition-colors hover:border-lm-teal hover:text-lm-teal"
          >
            {b.label}
          </Link>
        ))}
      </div>
    </div>
  );
}