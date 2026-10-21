import { Link } from "react-router-dom";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import Footer from "@/components/sdr/Footer";

const SECTIONS = [
  {
    h: "Our services",
    p: [
      "Same Day Recycling provides same-day junk removal, furniture and appliance removal, estate and rental cleanouts, renovation debris hauling and free metal pickup in major Canadian cities and partner territories across Canada. Booking by phone, text, website form or through our online booking assistant creates a service request.",
    ],
  },
  {
    h: "Quotes and pricing",
    p: [
      "Online and phone quotes are estimates based on the information you provide. The final price is confirmed with you on arrival, before any item is lifted, based on the actual volume of your load. You approve the price before work begins. Pricing is based on truck space used, from a minimum pickup charge up to a full truck load.",
    ],
  },
  {
    h: "Same-day service",
    p: [
      "We work hard to complete bookings made before noon the same day, but same-day arrival is not guaranteed and depends on demand, location and crew availability. We will always confirm your arrival window with you in advance.",
    ],
  },
  {
    h: "Items we cannot take",
    p: [
      "We cannot accept hazardous materials, including paint, chemicals, asbestos, fuel, solvents and propane tanks. If prohibited items are found in your load, they will be left behind and the price will be adjusted accordingly.",
    ],
  },
  {
    h: "Access and preparation",
    p: [
      "You confirm that the items you ask us to remove belong to you or that you are authorized to have them removed, and that our crew can safely access them. For curbside pickups, items must be placed outside before the arrival window.",
    ],
  },
  {
    h: "Payment",
    p: [
      "Payment is due upon completion of the job unless other arrangements have been made in advance. We accept the payment methods confirmed with you at booking. Subscription plan customers are billed monthly per their plan agreement.",
    ],
  },
  {
    h: "Cancellation and changes",
    p: [
      "You can reschedule or cancel free of charge before our crew departs for your booking. Cancellations after arrival may be subject to a trip charge.",
    ],
  },
  {
    h: "Eco-friendly disposal",
    p: [
      "We sort every load to recycle or donate what we can. Donation and recycling receipts are available on request after your pickup.",
    ],
  },
  {
    h: "Liability",
    p: [
      "We carry appropriate insurance and take care to avoid damage to your property. Our liability for any claim related to a completed job is limited to the amount you paid for that job. Nothing in these terms limits liability that cannot be limited by law.",
    ],
  },
  {
    h: "Governing law",
    p: [
      "These terms are governed by the laws of Canada and the applicable province or territory. Questions about these terms? Call us at (604) 849-1745 or use our <contact>contact form</contact>.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="bg-white">
      <Navbar />
      <RexBanner message="The fine print — no junk in it, I promise." />
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Legal</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-4 text-slate-300">Same Day Recycling &middot; Canada &middot; Last updated October 2026</p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-8">
        <p className="text-slate-600">These terms apply to every booking and service provided by Same Day Recycling. By booking with us you agree to them.</p>
        {SECTIONS.map((s) => (
          <div key={s.h}>
            <h2 className="text-xl font-bold text-[#102B2A] mb-2">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="text-slate-600 mb-3">
                {para.split("<contact>").map((part, j) =>
                  j === 1 ? (
                    <Link key={j} to="/contact" className="font-semibold text-[#187B65] hover:underline">{part}</Link>
                  ) : (
                    part
                  )
                )}
              </p>
            ))}
          </div>
        ))}
      </section>
      <Footer />
    </div>
  );
}