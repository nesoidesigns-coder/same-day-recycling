import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Coins, Map, PhoneCall, Scale, Search } from "lucide-react";

// Consumer intelligence actions — the practical bridge from research to
// booking, kept visually quiet so the radar stays the centrepiece.
const ACTIONS = [
  { label: "Explore demand in my city", note: "Select your region on the map", to: "#live-map", Icon: Map, anchor: true },
  { label: "Compare removal options", note: "Sourced price comparisons", to: "#live-pricing", Icon: Scale, anchor: true },
  { label: "Understand local pricing", note: "Published rates, plainly explained", to: "/pricing", Icon: Coins },
  { label: "Check provider availability", note: "Verified coverage by city", to: "/coverage", Icon: PhoneCall },
  { label: "Get an instant estimate", note: "Item-by-item price preview", to: "/impact-calculator", Icon: Search },
  { label: "Book a pickup", note: "Same-day when booked before noon", to: "/request-service", Icon: CalendarCheck, primary: true },
];

export default function ConsumerActions() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {ACTIONS.map(({ label, note, to, Icon, primary, anchor }) => {
        const cls = `group flex flex-col rounded-2xl border px-4 py-3.5 text-left transition-colors ${
          primary
            ? "border-amber-400/40 bg-amber-400/10 hover:border-amber-400/70"
            : "border-cine-line/60 bg-cine-surface/60 hover:border-cine-cyan/50"
        }`;
        const inner = (
          <>
            <Icon className={`h-4 w-4 ${primary ? "text-amber-300" : "text-cine-cyan"}`} />
            <span className="mt-2 text-sm font-bold leading-snug text-cine-ink">{label}</span>
            <span className="mt-0.5 text-[11px] text-cine-muted">{note}</span>
          </>
        );
        return anchor ? (
          <a key={label} href={to} className={cls}>{inner}</a>
        ) : (
          <Link key={label} to={to} className={cls}>{inner}</Link>
        );
      })}
    </div>
  );
}

export function BookNowBar({ city }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cine-line/60 bg-cine-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2">
        <Link
          to={city ? `/request-service?city=${encodeURIComponent(city)}` : "/request-service"}
          className="flex-1 rounded-full bg-amber-400 px-4 py-2.5 text-center text-sm font-bold text-[#0a1220]"
        >
          Book a pickup <ArrowRight className="inline h-4 w-4" />
        </Link>
        <Link
          to="/coverage"
          className="rounded-full border border-cine-line/70 px-4 py-2.5 text-center text-sm font-semibold text-cine-ink"
        >
          Availability
        </Link>
      </div>
    </div>
  );
}