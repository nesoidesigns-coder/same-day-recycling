import { Link } from "react-router-dom";
import { CalendarCheck, HardHat, ArrowRight } from "lucide-react";

export default function ObservatoryFooter() {
  return (
    <footer className="border-t border-obs-line/30">
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
          <Link to="/request-service" className="obs-card-cta">
            <CalendarCheck className="size-6 text-obs-mint" />
            <h3 className="mt-3 text-lg font-bold text-obs-ink">Book a pickup</h3>
            <p className="mt-1 text-sm text-obs-muted">Get a quote and a confirmed time — no registration needed.</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-obs-mint">Start now <ArrowRight className="size-4" /></span>
          </Link>
          <Link to="/contractors" className="obs-card-cta">
            <HardHat className="size-6 text-obs-mint" />
            <h3 className="mt-3 text-lg font-bold text-obs-ink">Join the network</h3>
            <p className="mt-1 text-sm text-obs-muted">Territory intelligence, dispatch and customer tools for contractors.</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-obs-mint">Partner up <ArrowRight className="size-4" /></span>
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-obs-line/30 pt-6">
          <Link to="/" className="text-xs font-semibold text-obs-muted hover:text-obs-ink">← Back to samedayrecycling.ca</Link>
          <p className="font-plex text-[10px] tracking-wide text-obs-muted/70">
            CANADIAN SERVICE OBSERVATORY · VERIFIED DATA ONLY · ESTIMATES AND INDEX VALUES ARE LABELLED, NEVER BLENDED
          </p>
        </div>
      </div>
    </footer>
  );
}