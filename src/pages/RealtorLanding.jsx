import { Home, Clock, DollarSign, Recycle, ShieldCheck, Building2, Phone, CalendarCheck, KeyRound } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import RealtorLeadForm from "@/components/sdr/RealtorLeadForm";
import Footer from "@/components/sdr/Footer";
import { Image } from "@/components/ui/image";

const heroImg = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/b9a321aaa_generated_7ecc31ed.jpg";

const BENEFITS = [
  { icon: Home, title: "Same-day cleanouts", text: "Book before noon and the clutter is gone that afternoon — listings photograph and show clean, without delaying your timeline." },
  { icon: DollarSign, title: "Upfront flat pricing", text: "Priced by truck space, approved before we lift anything. One invoice you can bill to the estate, the seller, or yourself." },
  { icon: Clock, title: "Closing-day rescues", text: "Buyers didn't want the furniture? Tenant left a garage behind? We haul it before possession day." },
  { icon: Recycle, title: "Eco-friendly story", text: "We recycle and donate everything salvageable — a selling point your clients will appreciate." },
];

const SCENARIOS = [
  "Estate and downsizing cleanouts, handled discreetly and fast",
  "Pre-listing decluttering: garages, basements, sheds, hot tubs",
  "Tenant turnover and eviction junk hauls for landlords and strata managers",
  "Closing-day leftovers gone before possession day",
];

export default function RealtorLanding() {
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <RexBanner message="Listings photo-ready by dinner — that's my promise." />
      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-5">
              <span className="w-8 h-px bg-[#1d9e56]" />
              For realtors &amp; property managers
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#0c3b24]">
              Same-Day House Cleanouts for Your Listings
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-md leading-relaxed">
              Estate cleanouts, tenant turnovers and pre-listing junk removal — done the same day, with upfront flat pricing and one simple invoice. Serving Vancouver, Burnaby, Richmond, Surrey, Coquitlam, Kamloops and Kelowna.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#17a04c] transition-colors">
                Book a Listing Cleanout
              </a>
              <a href="tel:+16048491745" className="rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#0c3b24] hover:text-white transition-colors flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> (604) 849-1745
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100">
              <Image src={heroImg} alt="Same-day house cleanout crew clearing a listing" className="w-full h-full" fittingType="fill" />
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-[#1d9e56]/15 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-[#1d9e56]" />
              </span>
              <div className="leading-tight">
                <div className="text-xs text-slate-500 font-medium">Realtors &amp; strata managers</div>
                <div className="font-bold text-[#0c3b24]">Same-day dispatch</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#f4f7f5] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0c3b24] text-center">Why realtors call us first</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-3xl bg-white border border-slate-100 p-6">
                <span className="w-10 h-10 rounded-full bg-[#1d9e56]/15 flex items-center justify-center mb-3">
                  <b.icon className="w-5 h-5 text-[#1d9e56]" />
                </span>
                <h3 className="font-bold text-[#0c3b24]">{b.title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios + steps */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0c3b24] flex items-center gap-2 mb-6">
              <Building2 className="w-6 h-6 text-[#1d9e56]" /> Built for your deals
            </h2>
            <ul className="space-y-3">
              {SCENARIOS.map((s) => (
                <li key={s} className="flex gap-3 text-slate-700">
                  <CalendarCheck className="w-5 h-5 text-[#1d9e56] shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#1d9e56] p-5">
                <h3 className="font-bold text-[#0c3b24] text-sm">Realtor referral credit</h3>
                <p className="text-sm text-slate-600 mt-1">$25 credit for every completed job you send our way — paid to you or applied to your client's invoice.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#1d9e56] p-5">
                <h3 className="font-bold text-[#0c3b24] text-sm">Property manager plan</h3>
                <p className="text-sm text-slate-600 mt-1">$299/month covers up to 4 pickups — ideal for ongoing turnover cleanouts across a portfolio.</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0c3b24] flex items-center gap-2 mb-6">
              <ShieldCheck className="w-6 h-6 text-[#1d9e56]" /> How it works
            </h2>
            <div className="space-y-4">
              {[
                { step: "1", text: "Book online in 2 minutes below, or call us. Text photos of the items if it's easier." },
                { step: "2", text: "We confirm an upfront flat price by load size and arrive the same day when booked before noon." },
                { step: "3", text: "We lift everything, sweep up, and leave — recycling and donating whatever's salvageable." },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl bg-[#f4f7f5] p-5 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold flex items-center justify-center shrink-0">{s.step}</div>
                  <p className="text-slate-700 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Booking form */}
      <section id="book" className="bg-[#f4f7f5] py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4">
          <RealtorLeadForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}