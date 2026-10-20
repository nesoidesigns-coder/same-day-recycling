import { Link } from "react-router-dom";
import { MapPin, Rocket, ArrowRight, Phone } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { CITIES } from "@/lib/cities";

const RECRUITING = ["Edmonton", "Calgary"];

export default function Coverage() {
  return (
    <div className="bg-white">
      <Navbar />

      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-3">Coverage</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">Where we pick up</h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl">
            Live territories across British Columbia — and new partner territories opening across Alberta.
            One partner per city, in order of application.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-bold text-[#0c3b24] flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#1d9e56]" /> Active
        </h2>
        <p className="mt-2 text-slate-600">Same-day service running today — book on each city's page.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              to={`/junk-removal-${c.slug}`}
              className="group rounded-2xl border border-slate-100 bg-white shadow-sm p-6 flex items-center justify-between hover:border-[#1d9e56] transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#1d9e56]" />
                <div>
                  <div className="font-bold text-[#0c3b24]">{c.name}, BC</div>
                  <div className="text-xs text-slate-500">Same-day pickups live</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1d9e56] transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl font-bold text-[#0c3b24] flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#0c3b24]" /> Recruiting
          </h2>
          <p className="mt-2 text-slate-600">
            Partner applications open — contractors run these territories under the Same Day Recycling machine.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RECRUITING.map((city) => (
              <Link
                key={city}
                to={`/contractors?city=${encodeURIComponent(city)}`}
                className="group rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex items-center justify-between hover:border-[#1d9e56] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Rocket className="w-5 h-5 text-[#1d9e56]" />
                  <div>
                    <div className="font-bold text-[#0c3b24]">{city}, AB</div>
                    <div className="text-xs text-slate-500">Applications open</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1d9e56] transition-colors" />
              </Link>
            ))}
            <Link
              to="/contractors"
              className="rounded-2xl bg-[#0c3b24] text-white p-6 flex items-center justify-between hover:bg-[#0a3020] transition-colors"
            >
              <div>
                <div className="font-bold">Your city not listed?</div>
                <div className="text-xs text-slate-300 mt-1">Apply — territories open in order of application.</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#1d9e56]" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0c3b24]">Need a pickup today?</h2>
          <p className="mt-2 text-slate-600">Call or text and we'll get a truck moving.</p>
          <a href="tel:+16048491745" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-8 py-4 hover:bg-[#17a04c] transition-colors">
            <Phone className="w-5 h-5" /> (604) 849-1745
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}