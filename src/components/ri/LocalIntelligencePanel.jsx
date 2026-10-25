import { MapPin, Recycle, Clock } from "lucide-react";
import SignalGauge from "@/components/signals/SignalGauge";

// "Your Local Service Intelligence" — one gauge plus at most three cards.
// Data comes only from verified sources (coverage snapshot of verified
// contractor records, and the labeled preliminary estimate). Missing data
// shows an explicit unavailable state, never invented activity.
const STATUS_COPY = {
  same_day: { chip: "Verified local coverage", tone: "bg-ri-emerald/10 text-ri-emerald", text: "Verified contractors cover this city. Same-day pickup is possible, but it is only confirmed after a contractor accepts your job." },
  matching: { chip: "Provider matching", tone: "bg-ri-amber/10 text-ri-amber", text: "Requests in this city are matched with providers as availability is confirmed. Nothing is scheduled until a provider accepts." },
  recruiting: { chip: "Network expanding here", tone: "bg-ri-mint text-ri-forest", text: "Verified coverage is being built here. Your request still enters the national matching queue." },
  currently_unavailable: { chip: "No verified coverage yet", tone: "bg-si-bg2 text-ri-slate", text: "No verified contractor data for this city yet — your request enters the national matching queue." },
};

export default function LocalIntelligencePanel({ city, coverage, estimate, serviceType }) {
  const status = city && coverage.loaded ? coverage.statusFor(city) : null;
  const statusInfo = status ? STATUS_COPY[status] : null;

  let gauge;
  if (city && coverage.loaded && status === "same_day") {
    const count = coverage.capacityFor(city)?.contractors ?? coverage.contractorCounts?.[city] ?? 0;
    gauge = {
      value: Math.max(1, count), max: Math.max(4, count), unit: "local",
      label: `Verified contractors covering ${city}`,
      sub: "Verified service-network readiness for this city",
      source: "Verified contractor records", updatedAt: coverage.generatedAt,
    };
  } else if (!city && coverage.totals) {
    gauge = {
      value: coverage.totals.currently_available, max: Math.max(coverage.totals.contractors || 4, 4), unit: "network",
      label: "Contractors available across the network",
      sub: "Enter your city to see verified local coverage",
      source: "Verified contractor records", updatedAt: coverage.generatedAt,
    };
  } else {
    gauge = {
      unavailableReason: city
        ? "Local coverage data is not confirmed for this city yet. Your request still enters the national matching queue."
        : "Enter your city in the request form to load local service intelligence.",
    };
  }

  return (
    <aside className="rounded-2xl bg-white border border-si-line shadow-sm p-5" aria-label="Your local service intelligence">
      <div className="text-sm font-bold text-ri-charcoal">Your Local Service Intelligence</div>
      <div className="mt-4">
        <SignalGauge {...gauge} />
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl bg-ri-ivory border border-si-line p-3.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-ri-emerald shrink-0" />
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusInfo ? statusInfo.tone : "bg-si-bg2 text-ri-slate"}`}>
              {statusInfo ? statusInfo.chip : "Enter your city for local status"}
            </span>
          </div>
          <p className="mt-2 text-xs text-ri-slate leading-relaxed">
            {statusInfo ? statusInfo.text : "Your city unlocks verified local coverage, indicative pricing and matching status."}
          </p>
        </div>

        <div className="rounded-xl bg-ri-ivory border border-si-line p-3.5">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-ri-emerald shrink-0" />
            <span className="text-xs font-bold text-ri-charcoal">Indicative pricing</span>
          </div>
          {estimate ? (
            <>
              <div className="mt-1.5 font-plex text-lg font-bold text-ri-charcoal">{estimate.range}</div>
              <div className="font-plex text-[11px] text-ri-slate">Load: {estimate.eighths}/8 of a truck · preliminary, not a confirmed price</div>
            </>
          ) : (
            <p className="mt-1.5 text-xs text-ri-slate leading-relaxed">
              Describe your items above for an indicative range. Final pricing is confirmed and approved by you before any work.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-ri-ivory border border-si-line p-3.5">
          <div className="flex items-center gap-2">
            <Recycle className="w-3.5 h-3.5 text-ri-emerald shrink-0" />
            <span className="text-xs font-bold text-ri-charcoal">What we accept</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Furniture", "Appliances", "Cleanouts", "Electronics", "Scrap metal", "Mixed loads"].map((t) => (
              <span key={t} className="rounded-full bg-white border border-si-line px-2.5 py-1 text-[11px] font-semibold text-ri-slate">{t}</span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ri-slate leading-relaxed">
            Recyclable and reusable materials are routed to responsible handling wherever local facilities allow.
          </p>
        </div>
      </div>
    </aside>
  );
}