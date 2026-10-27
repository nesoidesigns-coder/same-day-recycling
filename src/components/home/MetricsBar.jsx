import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-CA") : "—");

// The live strip under the rail: four verified counts, and the way into the
// full intelligence view.
export default function MetricsBar({ cities, contractors, observations, categories, loading }) {
  const metrics = [
    { value: cities, label: "Cities in Network" },
    { value: contractors, label: "Verified Contractor" },
    { value: observations, label: "Service Observations (30 Days)" },
    { value: categories, label: "Service Categories" },
  ];

  return (
    <section className="mx-auto max-w-[1280px] px-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-lm-line bg-white p-4 lg:flex-row lg:items-center lg:gap-0 lg:p-5">
        <div className="grid flex-1 grid-cols-2 gap-y-4 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <div key={m.label} className={`px-1 lg:px-5 ${i > 0 ? "lg:border-l lg:border-lm-line" : ""}`}>
              <div className="font-heading text-[26px] font-extrabold leading-none text-lm-ink tabular-nums">
                {loading ? "…" : fmt(m.value)}
              </div>
              <div className="mt-1.5 text-[11.5px] font-semibold text-lm-muted">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="shrink-0 rounded-xl bg-[hsl(var(--lm-teal))]/[0.07] p-4 lg:ml-5 lg:w-[290px]">
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-[hsl(var(--lm-teal))]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--lm-teal))] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--lm-teal))]" />
            </span>
            Live Intelligence
          </div>
          <p className="mt-1 text-[12px] leading-snug text-lm-muted">See what Canadians are searching for and where demand is rising.</p>
          <Link
            to="/live"
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--lm-teal))] px-3.5 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
          >
            View Live Intelligence <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}