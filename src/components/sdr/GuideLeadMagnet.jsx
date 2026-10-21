import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Loader2, BookOpen, ChevronDown } from "lucide-react";

const GUIDE = [
  ["Know what's banned", "Many municipalities ban mattresses, appliances (fridges, washers, stoves), drywall and tires from regular garbage. Plan for special handling of these items in every turnover — they need separate drop-offs or a hauler who sorts them properly."],
  ["Schedule around move-out dates", "Book junk removal for the day after key return, before the unit is repainted or listed. A same-day pickup keeps vacant units rent-ready instead of sitting with a pile at the curb."],
  ["Book elevators early", "High-rise buildings usually require an elevator reservation and floor protection for any move-out. Put the pickup window on your building calendar at the same time as the elevator booking so the crew and the elevator arrive together."],
  ["Stage curbside to save money", "Items staged in the loading bay, carport or lane (not inside the unit) can qualify for a curbside discount — the crew loads straight from the curb with a shorter on-site time."],
  ["Track your diversion", "Ask for a recycling receipt for every load. It shows what was donated, recycled or disposed of — useful records for strata minutes, council reporting and green-building requirements."],
  ["Use a standing plan for bulk weeks", "Lease turnovers and spring cleanouts cluster. A monthly plan with reserved pickup slots beats scrambling for a truck every time three units clear at once."],
];

export default function GuideLeadMagnet() {
  const [form, setForm] = useState({ name: "", email: "", building: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Please add your name and email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await base44.entities.QuoteLead.create({
        name: form.name.trim(),
        email: form.email.trim(),
        city: "Property Manager",
        items_text: "Building Waste Disposal Guide",
        description: form.building.trim() ? `Guide request — building: ${form.building.trim()}` : "Guide request",
      });
      base44.analytics.track("guide_downloaded", { role: "property_manager" });
      setUnlocked(true);
    } catch {
      setError("Couldn't save that right now — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="guide" className="bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
        <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Free resource</div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#102B2A]">
          Building Waste Disposal Guide
        </h2>
        <p className="mt-3 text-slate-600">
          The six rules every building manager should know — disposal bans, elevator scheduling, curbside staging and turnover timing.
        </p>

        {!unlocked ? (
          <form onSubmit={submit} className="mt-8 rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6 md:p-8">
            <div className="flex items-center gap-2 font-bold text-[#102B2A] mb-5">
              <Download className="w-5 h-5 text-[#187B65]" /> Get the guide free
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <input className="input" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <input className="input mt-4" placeholder="Building or company (optional)" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
            <button type="submit" disabled={loading} className="mt-5 w-full sm:w-auto rounded-full bg-[#102B2A] text-white font-bold px-7 py-3.5 hover:bg-[#0a3020] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {loading ? "Opening…" : "Send me the guide"}
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <p className="mt-3 text-xs text-slate-500">No spam — we'll only follow up about your building's pickups.</p>
          </form>
        ) : (
          <div className="mt-8 rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6 md:p-8">
            <div className="flex items-center gap-2 font-bold text-[#102B2A] mb-5">
              <BookOpen className="w-5 h-5 text-[#187B65]" /> Your guide is ready
            </div>
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
              {GUIDE.map(([title, body]) => (
                <details key={title} className="group px-5 py-4">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-[#102B2A] text-sm">
                    {title}
                    <ChevronDown className="w-5 h-5 text-[#187B65] shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{body}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}