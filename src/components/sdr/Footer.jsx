import { useEffect, useState } from "react";
import { Recycle, Phone, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import VisitTracker from "./VisitTracker";

const links = [
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Free Metal Pickup", to: "/free-metal-pickup" },
  { label: "Recycling Centers", to: "/recycling-centers" },
  { label: "Blog", to: "/blog" },
  { label: "Subscriptions", to: "/subscriptions" },
  { label: "Leave a Review", to: "/review" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

export default function Footer() {
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-bold text-[#0c3b24]">
          <span className="w-8 h-8 rounded-lg bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Recycle className="w-4 h-4" />
          </span>
          <span>© 2026 Same Day Recycling — samedayrecycling.ca</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {isAdmin && (
            <Link to="/admin/jobs" className="flex items-center gap-1 text-sm font-bold text-[#1d9e56] hover:underline">
              <Lock className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/marketing" className="flex items-center gap-1 text-sm font-bold text-[#1d9e56] hover:underline">
              <Lock className="w-3.5 h-3.5" /> Marketing
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/facebook" className="flex items-center gap-1 text-sm font-bold text-[#1d9e56] hover:underline">
              <Lock className="w-3.5 h-3.5" /> FB AI
            </Link>
          )}
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-[#1d9e56] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-start md:items-end gap-1.5 text-sm">
          <a href="tel:+16048491745" className="flex items-center gap-2 text-slate-700 font-medium hover:text-[#1d9e56] transition-colors">
            <Phone className="w-4 h-4 text-[#1d9e56]" />
            (604) 849-1745
          </a>
          <a href="mailto:samedayrecycling@gmail.com" className="flex items-center gap-2 text-slate-700 font-medium hover:text-[#1d9e56] transition-colors">
            <Mail className="w-4 h-4 text-[#1d9e56]" />
            samedayrecycling@gmail.com
          </a>
          <div className="text-slate-600">Open 24 hours · Vancouver, BC</div>
        </div>
      </div>
      <VisitTracker />
    </footer>
  );
}