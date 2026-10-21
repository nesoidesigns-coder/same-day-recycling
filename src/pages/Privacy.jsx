import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import Footer from "@/components/sdr/Footer";

const SECTIONS = [
  {
    h: "Information we collect",
    p: [
      "When you book a pickup, request a quote, or contact us, we collect the details you give us: your name, phone number, email address, pickup address, the description of your items and any photos you attach.",
      "If you chat with our online booking assistant, we keep a record of the conversation so we can follow up on your request. If you leave a review, we keep the name, rating and text you submit.",
      "We also collect basic website analytics (pages visited, how you found us) to improve the site. This data is not used to identify you personally.",
    ],
  },
  {
    h: "How we use your information",
    p: [
      "We use your information to quote and schedule your pickup, contact you about your booking, assign and route your job to our crew or a trusted partner, process payment and respond to your questions.",
      "We may email or call you about your booking or, if you had a pickup completed, to ask for a review. We never sell your personal information.",
    ],
  },
  {
    h: "Sharing with third parties",
    p: [
      "We share booking details only with the crew member or partner dispatcher handling your job. We use service providers (such as our hosting, messaging and analytics platforms) that process data on our behalf and are bound to protect it.",
      "We may disclose information if required by law or to protect our rights and safety.",
    ],
  },
  {
    h: "Data storage and retention",
    p: [
      "Your information is stored securely and only kept as long as needed to serve you and meet our record-keeping obligations. Booking records, including donation and recycling receipts, may be retained for accounting purposes.",
    ],
  },
  {
    h: "Your choices",
    p: [
      "You can ask us to access, correct or delete your personal information at any time. You can also ask us not to contact you for review requests. Just reach out using the details below and we will take care of it promptly.",
    ],
  },
  {
    h: "Cookies and analytics",
    p: [
      "This site uses essential cookies to keep the site working and analytics tools (such as Google Analytics) to understand traffic. Analytics data is aggregated and does not identify you personally.",
    ],
  },
];

export default function Privacy() {
  useSEO({
    title: "Privacy Policy | Same Day Recycling",
    description: "How Same Day Recycling collects, uses, retains and protects your personal information.",
    path: "/privacy",
  });
  return (
    <div className="bg-white">
      <Navbar />
      <RexBanner message="I recycle junk, not your data." />
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Legal</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-4 text-slate-300">Same Day Recycling &middot; Canada &middot; Last updated October 2026</p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-8">
        <p className="text-slate-600">Same Day Recycling provides same-day junk removal, furniture removal and recycling services across Canada. This policy explains what personal information we collect, why, and how you can control it. Questions? Call us at (604) 849-1745 or use our <Link to="/contact" className="font-semibold text-[#187B65] hover:underline">contact form</Link>.</p>
        {SECTIONS.map((s) => (
          <div key={s.h}>
            <h2 className="text-xl font-bold text-[#102B2A] mb-2">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="text-slate-600 mb-3">{para}</p>
            ))}
          </div>
        ))}
      </section>
      <Footer />
    </div>
  );
}