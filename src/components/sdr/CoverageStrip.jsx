import { Link } from "react-router-dom";
import { CITIES } from "@/lib/cities";
import { MapPin, Rocket } from "lucide-react";

export default function CoverageStrip() {
  return (
    <section className="bg-[#f4f7f5] border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <p className="font-bold text-[#0c3b24] shrink-0">
            Now serving British Columbia — now recruiting partners in Alberta.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1d9e56]" />
            {CITIES.map((c) => (
              <Link
                key={c.slug}
                to={`/junk-removal-${c.slug}`}
                className="rounded-full bg-white border border-slate-200 px-4 py-1.5 text-sm font-semibold text-[#0c3b24] hover:border-[#1d9e56] transition-colors"
              >
                {c.name}
              </Link>
            ))}
            <Link
              to="/contractors"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0c3b24] text-white px-4 py-1.5 text-sm font-semibold hover:bg-[#0a3020] transition-colors"
            >
              <Rocket className="w-3.5 h-3.5 text-[#1d9e56]" />
              Alberta — coming soon, partner applications open
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}