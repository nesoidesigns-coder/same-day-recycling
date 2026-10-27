import { useState, useEffect } from "react";
import { Recycle, Phone, Mail, Lock, ArrowRight, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VisitTracker from "./VisitTracker";
import FooterLiveStrip from "@/components/landing/FooterLiveStrip";

// Footer links grouped into tabs so 29 destinations stay readable instead of
// becoming one dense paragraph of text.
const TABS = [
  {
    id: "services",
    label: "Services",
    links: [
      { label: "Junk Removal", to: "/request-service" },
      { label: "Furniture Removal", to: "/furniture-removal" },
      { label: "Appliance Removal", to: "/appliance-removal" },
      { label: "Electronics Recycling", to: "/electronics-recycling" },
      { label: "Commercial Removal", to: "/commercial-recycling" },
      { label: "Same-Day Pickup", to: "/same-day-pickup" },
      { label: "Free Metal Pickup", to: "/free-metal-pickup" },
      { label: "Explore All Services", to: "/services" },
    ],
  },
  {
    id: "live",
    label: "Live Intelligence",
    links: [
      { label: "Live Service Radar", to: "/live" },
      { label: "National Demand", to: "/demand" },
      { label: "Coverage Map", to: "/coverage" },
      { label: "Recycling Centres", to: "/recycling-centers" },
      { label: "Impact Calculator", to: "/impact-calculator" },
      { label: "Disposal Advisor", to: "/recycling-assistant" },
      { label: "Community & Requests", to: "/community" },
      { label: "Track Your Request", to: "/request-status" },
    ],
  },
  {
    id: "company",
    label: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Pricing", to: "/pricing" },
      { label: "Fleet Gallery", to: "/gallery" },
      { label: "Blog & Guides", to: "/blog" },
      { label: "Leave a Review", to: "/review" },
      { label: "Move Assist", to: "/move-assist" },
      { label: "Recycling Directory", to: "/recycling" },
    ],
  },
  {
    id: "partners",
    label: "For Partners",
    links: [
      { label: "Become a Contractor", to: "/contractors" },
      { label: "Contractor Membership", to: "/contractor-membership" },
      { label: "Property Managers", to: "/property-managers" },
      { label: "Realtors", to: "/realtors" },
      { label: "Software OS", to: "/software" },
      { label: "White Label", to: "/white-label" },
      { label: "Subscriptions", to: "/subscriptions" },
      { label: "Service Finder", to: "/service-finder" },
    ],
  },
];

const LEGAL = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "License Agreement", to: "/license-agreement" },
];

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("services");

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setIsAdmin(me?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  const active = TABS.find((t) => t.id === tab) || TABS[0];

  return (
    <footer className="bg-ri-forest text-ri-ivory/70">
      <div className="mx-auto max-w-[1280px] px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Brand + contact */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ri-amber text-ri-forest">
                <Recycle className="h-4 w-4" />
              </span>
              <span className="font-heading text-[15px] font-extrabold">Same Day Recycling</span>
            </Link>
            <p className="mt-2 max-w-xs text-[11.5px] leading-snug text-ri-ivory/60">
              Powered by Recycling OS — connecting customers, contractors and intelligent service operations through one accountable platform.
            </p>
            <div className="mt-3 flex flex-col gap-1.5 text-[12px]">
              <a href="tel:+16048491745" className="flex items-center gap-2 font-medium text-white transition-colors hover:text-ri-amber">
                <Phone className="h-3.5 w-3.5 text-ri-amber" /> (604) 849-1745
              </a>
              <a href="mailto:samedayrecycling@gmail.com" className="flex items-center gap-2 font-medium transition-colors hover:text-ri-amber">
                <Mail className="h-3.5 w-3.5 text-ri-amber" /> samedayrecycling@gmail.com
              </a>
              <span className="text-[10.5px] text-ri-ivory/45">Open 24 hours · Expanding through verified Canadian partners</span>
            </div>
            <Link
              to="/live"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ri-amber/40 bg-ri-amber/10 px-3 py-1.5 text-[11px] font-bold text-ri-amber transition-colors hover:bg-ri-amber/20"
            >
              <Radio className="h-3 w-3" /> Live service radar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Tabbed links */}
          <div className="lg:col-span-8">
            <div className="flex flex-wrap gap-1 border-b border-ri-ivory/15" role="tablist" aria-label="Footer sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={t.id === tab}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-3 py-2 text-[11.5px] font-bold transition-colors ${
                    t.id === tab
                      ? "border-ri-amber text-white"
                      : "border-transparent text-ri-ivory/60 hover:text-ri-ivory"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "live" && <div className="mt-3"><FooterLiveStrip /></div>}

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4" role="tabpanel">
              {active.links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-[11.5px] font-medium text-ri-ivory/70 transition-colors hover:text-ri-amber"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ri-ivory/10 pt-3">
              {LEGAL.map((l) => (
                <Link key={l.to} to={l.to} className="text-[10.5px] font-medium text-ri-ivory/50 hover:text-ri-amber">
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <>
                  <Link to="/admin/jobs" className="flex items-center gap-1 text-[10.5px] font-bold text-ri-amber hover:underline">
                    <Lock className="h-3 w-3" /> Admin
                  </Link>
                  <Link to="/admin/marketing" className="flex items-center gap-1 text-[10.5px] font-bold text-ri-amber hover:underline">
                    <Lock className="h-3 w-3" /> Marketing
                  </Link>
                  <Link to="/admin/facebook" className="flex items-center gap-1 text-[10.5px] font-bold text-ri-amber hover:underline">
                    <Lock className="h-3 w-3" /> FB AI
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-ri-ivory/10 pt-3 text-[10.5px] text-ri-ivory/45">
          © 2026 Same Day Recycling — samedayrecycling.ca
        </div>
      </div>
      <VisitTracker />
    </footer>
  );
}