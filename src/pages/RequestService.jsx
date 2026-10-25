import { useSEO } from "@/lib/seo";
import { Globe2, ClipboardList, Search, Handshake, CalendarCheck, BadgeCheck } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import NationalRequestForm from "@/components/sdr/NationalRequestForm";

const DISTINCTIONS = [
  { icon: Globe2, label: "Request submissions available nationwide" },
  { icon: BadgeCheck, label: "Verified service territories" },
  { icon: Search, label: "Provider matching in progress" },
  { icon: CalendarCheck, label: "Confirmed service appointments" },
];

const STEPS = [
  { icon: ClipboardList, title: "Submit your request", text: "From any province or territory — any city, any postal code." },
  { icon: Search, title: "We match local providers", text: "Your request is routed to verified local recycling and removal companies." },
  { icon: Handshake, title: "Provider confirms", text: "A provider confirms availability and pricing for your job." },
  { icon: CalendarCheck, title: "Confirmed appointment", text: "You receive a confirmed quote and appointment. No charge before confirmation." },
];

export default function RequestService() {
  useSEO({
    title: "Request Recycling or Junk Removal Anywhere in Canada | Same Day Recycling",
    description: "Request recycling, junk removal and material pickup services in any Canadian province or territory. Our platform connects you with local service providers as availability is confirmed.",
    path: "/request-service",
  });

  return (
    <div className="bg-white">
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-3">National Network</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Canada's Recycling Network. One Intelligent Platform.
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl">
            Now accepting recycling and junk removal inquiries across Canada. Local service availability
            and scheduling are confirmed after your request.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {DISTINCTIONS.map((d) => (
              <span key={d.label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-bold text-slate-100">
                <d.icon className="w-3.5 h-3.5 text-gold" /> {d.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <NationalRequestForm />
      </section>

      <section className="bg-[#f4f7f5] border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#102B2A] text-center">How provider matching works</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold text-slate-300">0{i + 1}</span>
                </div>
                <div className="mt-4 font-bold text-[#102B2A]">{s.title}</div>
                <p className="mt-1.5 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500 max-w-xl mx-auto">
            Request junk removal anywhere in Canada. Same-day service is subject to confirmed local
            provider availability. A verified service territory is not a confirmed appointment: a local
            contractor must accept your specific job, with your price and arrival window agreed first.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}