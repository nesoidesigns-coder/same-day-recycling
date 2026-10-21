import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

const SECTIONS = [
  {
    h: "1. Definitions",
    p: [
      '"We", "us" and "Same Day Recycling" mean Same Day Recycling, the operator and licensor of the Recycling OS software platform.',
      '"Licensee" and "you" mean the business entity named on the license record, identified at purchase by company name, contact name and email address.',
      '"The Software" means the Same Day Recycling Recycling OS: the customer management, scheduling, dispatch, invoicing, analytics, and payment-configuration features licensed to you, together with your isolated instance of associated data storage.',
      '"License Fee" means the one-time instance fee and any recurring subscription fee applicable to your plan, as shown on your payment record.',
    ],
  },
  {
    h: "2. License grant and ownership",
    p: [
      "Upon verified payment, we grant you a non-exclusive, non-transferable licence to operate one branded instance of the Software for the single business named on the license record.",
      "The Software itself — its code, design, workflows, integrations and documentation — remains our exclusive property. You are buying the right to operate it, not ownership of it. You may not copy, resell, sublicense, reverse-engineer, or provide the Software to third parties as a competing service.",
      "Your business data — your customers, bookings, schedules, invoices and analytics — is yours. It remains yours while your licence is active and is exportable to you on request.",
    ],
  },
  {
    h: "3. Permitted use",
    p: [
      "You may use the Software to operate your own waste, junk removal, recycling or haulage business, including customer management, dispatch and invoicing for that business.",
      "You may configure your instance's branding (business name, colours, logo and support contacts) and payment settings for your business.",
      "One licence covers one business entity. Operating multiple distinct businesses, brands or territories on a single instance requires one licence per business.",
    ],
  },
  {
    h: "4. Data isolation and privacy",
    p: [
      "Each licensee's customers, bookings, and financial records are stored in an isolated data scope. No other licensee — and no member of the public — can read, create, modify or delete your records.",
      "We can access your records only to provide support, billing and platform operation, and only within the limits of our Privacy Policy.",
      "You are responsible for the lawfulness of the customer data you enter into your instance and for your own compliance with applicable Canadian privacy laws (including PIPEDA) with respect to that data.",
    ],
  },
  {
    h: "5. Hosting and availability",
    p: [
      "The Software is hosted by us on managed cloud infrastructure. You do not self-host, and you do not select or manage the underlying servers.",
      "We aim for continuous availability but do not guarantee uninterrupted service. Scheduled maintenance is performed where possible during low-traffic hours.",
      "You are responsible for your own internet connection and for keeping your account credentials secure.",
    ],
  },
  {
    h: "6. Updates and maintenance",
    p: [
      "Platform updates, security patches and feature improvements are included with an active subscription and are applied automatically at no additional cost.",
      "Where an update materially changes how a core feature works, we will provide notice through the platform or by email.",
      "Custom feature development beyond the standard platform is quoted separately and is not included in the licence fee.",
    ],
  },
  {
    h: "7. Support",
    p: [
      "Licensees receive email support for account, access and feature issues at samedayrecycling@gmail.com.",
      "We provide reasonable onboarding assistance for new instances. Response times vary; there is no guaranteed response time unless a separate support agreement is signed.",
      "Support does not include data entry, business consulting, or troubleshooting of third-party services outside the platform.",
    ],
  },
  {
    h: "8. Fees, payment and activation",
    p: [
      "The instance fee is due at purchase. Subscription fees recur on the billing cycle selected at purchase.",
      "Activation of your instance requires both a paid instance fee and an active subscription, confirmed through our payment processor. Access to the company dashboard is granted only after payment is verified server-side; a checkout redirect alone never grants access.",
      "If a subscription is cancelled, expires or is suspended, dashboard access pauses and can be restored by resuming or renewing the subscription.",
    ],
  },
  {
    h: "9. Term and termination",
    p: [
      "Your licence runs while your subscription is active. You may cancel at any time; cancellation takes effect at the end of the current billing period.",
      "We may suspend or terminate a licence for non-payment or for breach of this agreement, with notice where practicable.",
      "Within 30 days of termination, we will make your business data available for export on request, after which we may delete it in line with our data retention practices.",
    ],
  },
  {
    h: "10. General",
    p: [
      "This agreement is governed by the laws of the Province of British Columbia and the laws of Canada applicable therein.",
      "This agreement, together with the general Terms of Service and Privacy Policy, forms the entire agreement between you and us regarding the Software.",
      "Questions about this agreement can be directed to samedayrecycling@gmail.com.",
    ],
  },
];

export default function LicenseAgreement() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#187B65] mb-2">Software Licensing</p>
        <h1 className="text-4xl font-bold text-[#102B2A] tracking-tight">Recycling OS Software License Agreement</h1>
        <p className="text-slate-500 mt-3">Last updated: October 2026 · Applies to every licensed instance of the Same Day Recycling Recycling OS.</p>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold text-[#102B2A] mb-3">{s.h}</h2>
              <div className="space-y-3">
                {s.p.map((para, i) => (
                  <p key={i} className="text-slate-600 leading-relaxed">{para}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-[#f4f7f5] border border-slate-200 p-6">
          <p className="text-sm text-slate-600">
            Ready to license the Recycling OS for your business?{" "}
            <a href="/software" className="font-bold text-[#187B65] hover:underline">See plans and pricing</a> or{" "}
            <a href="/contact" className="font-bold text-[#187B65] hover:underline">contact us</a> with questions before you buy.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}