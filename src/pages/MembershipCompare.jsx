import { useSEO } from "@/lib/seo";
import { CheckCircle2, XCircle, FileText, LogOut, Database, Scale, Phone } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import {
  MEMBERSHIP_TIERS, ACTIVATION, BILLING, INCLUDED, LIMITATIONS,
  CANCELLATION, OWNERSHIP_RULES, EXIT_PROCEDURES, DATA_EXPORT, REGIONS,
} from "@/lib/contractorTerms";

// Public, plain-language comparison of the contractor membership tiers.
// Shows actual entitlements, limitations, fees, billing, cancellation and
// regions only — never invented guarantees, exclusivity or revenue promises.
export default function MembershipCompare() {
  useSEO({
    title: "Contractor Membership Comparison | Same Day Recycling",
    description: "Compare Same Day Recycling contractor membership tiers: what's included, limitations, fees, billing, cancellation rules and service regions — stated plainly.",
    path: "/contractor-membership",
  });

  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Membership, stated plainly</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Contractor membership comparison</h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Everything below is the actual entitlement structure: what you get, what you don't, what it costs, how billing
            works, how you leave, and where it applies. No guaranteed job volumes, exclusive territories or revenue
            commitments — network access provides opportunities, not guarantees.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-[#102B2A]">Monthly membership tiers</h2>
        <p className="mt-2 text-slate-600 text-sm">Flat monthly territory subscription, plus {ACTIVATION.range} one-time activation to build and launch your pages.</p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px] border border-slate-200 rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-[#102B2A] text-white text-left">
                <th className="px-4 py-3 font-bold">Tier</th>
                <th className="px-4 py-3 font-bold">Monthly price</th>
                <th className="px-4 py-3 font-bold">Market type</th>
                <th className="px-4 py-3 font-bold">Activation</th>
              </tr>
            </thead>
            <tbody>
              {MEMBERSHIP_TIERS.map((t) => (
                <tr key={t.name} className="border-t border-slate-100">
                  <td className="px-4 py-3.5 font-bold text-[#102B2A]">{t.name}</td>
                  <td className="px-4 py-3.5 font-extrabold text-[#187B65]">${t.monthly}/mo</td>
                  <td className="px-4 py-3.5 text-slate-600">{t.market}</td>
                  <td className="px-4 py-3.5 text-slate-600">{ACTIVATION.range} one-time</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-5">
            <h3 className="font-bold text-[#102B2A]">Billing frequency &amp; method</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed"><span className="font-semibold text-[#102B2A]">{BILLING.frequency}:</span> {BILLING.method}. {BILLING.note}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-5">
            <h3 className="font-bold text-[#102B2A]">Applicable regions</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{REGIONS}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f7f5]">
        <div className="max-w-6xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-[#102B2A] flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#187B65]" /> What membership includes</h2>
            <ul className="mt-4 space-y-2.5">
              {INCLUDED.map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102B2A] flex items-center gap-2"><XCircle className="w-5 h-5 text-slate-500" /> What membership does not include</h2>
            <ul className="mt-4 space-y-2.5">
              {LIMITATIONS.map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />{i}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-[#102B2A]">Contractor ownership &amp; independence</h2>
        <ul className="mt-6 space-y-3">
          {OWNERSHIP_RULES.map((r) => (
            <li key={r} className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
              <Scale className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />{r}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-[#f4f7f5]">
        <div className="max-w-4xl mx-auto px-4 py-14 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-[#102B2A] flex items-center gap-2"><LogOut className="w-5 h-5 text-[#187B65]" /> Exit &amp; cancellation</h2>
            <ul className="mt-4 space-y-2.5">
              {CANCELLATION.map((i) => <li key={i} className="text-sm text-slate-600">• {i}</li>)}
            </ul>
            <h3 className="mt-6 font-bold text-[#102B2A] text-sm uppercase tracking-wide">Exit procedure</h3>
            <ul className="mt-2 space-y-2">
              {EXIT_PROCEDURES.map((i) => <li key={i} className="text-sm text-slate-600">• {i}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102B2A] flex items-center gap-2"><Database className="w-5 h-5 text-[#187B65]" /> Data export</h2>
            <ul className="mt-4 space-y-2.5">
              {DATA_EXPORT.map((i) => <li key={i} className="text-sm text-slate-600">• {i}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-slate-200 bg-[#f6f8f7] p-6 flex items-start gap-3">
          <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 leading-relaxed">
            This page is a plain-language summary. The written agreement you sign governs in every case. Fees are disclosed
            in writing before you accept any agreement. Membership terms are reviewed for Canadian provincial franchise-law
            applicability by legal counsel — see the{" "}
            <a href="/contractors" className="font-semibold text-[#187B65] hover:underline">network page</a> to apply, or call{" "}
            <a href="tel:+16048491745" className="inline-flex items-center gap-1 font-semibold text-[#187B65] hover:underline"><Phone className="w-3.5 h-3.5" /> (604) 849-1745</a>.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}