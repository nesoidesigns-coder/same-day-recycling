import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Gauge, Briefcase, Megaphone, Share2, Tag, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import ControlKpis from "@/components/admin/ControlKpis";
import BookingsTrendChart from "@/components/admin/BookingsTrendChart";
import StatusDonut from "@/components/admin/StatusDonut";
import RegionalPerformance from "@/components/admin/RegionalPerformance";
import ContractorStatus from "@/components/admin/ContractorStatus";

const HUBS = [
  { icon: Briefcase, label: "Dispatch & Payouts", to: "/admin/jobs", desc: "Assign jobs, confirm partners" },
  { icon: Megaphone, label: "Marketing Hub", to: "/admin/marketing", desc: "Live tracker, SEO, research" },
  { icon: Share2, label: "FB AI Hub", to: "/admin/facebook", desc: "Auto posts & replies" },
  { icon: Tag, label: "White Label", to: "/admin/white-label", desc: "Applications & licensees" },
  { icon: DollarSign, label: "Pricing", to: "/admin/pricing", desc: "City pricing ladders" },
];

export default function AdminControlCenter() {
  const [data, setData] = useState(null);
  const [quoteNew, setQuoteNew] = useState(null);

  useEffect(() => {
    (async () => {
      const [bookings, partners, clients] = await Promise.all([
        base44.entities.Booking.filter({}, { sort: "-created_date", limit: 500 }),
        base44.entities.Partner.filter({}, {}),
        base44.entities.WhiteLabelClient.filter({}, {}),
      ]);
      setData({
        bookings: bookings.items || bookings,
        partners: partners.items || partners,
        clients: clients.items || clients,
      });
    })().catch(() => setData({ bookings: [], partners: [], clients: [] }));
  }, []);

  useEffect(() => {
    if (!data) return;
    base44.entities.QuoteLead.count({ status: "new" })
      .then(setQuoteNew)
      .catch(() => setQuoteNew(null));
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-2xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight">Agency Control Center</h1>
            <p className="text-sm text-slate-500">Bookings, contractors and regions at a glance</p>
          </div>
        </div>

        <ControlKpis bookings={data.bookings} quoteNew={quoteNew} clients={data.clients} />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <BookingsTrendChart bookings={data.bookings} />
          <StatusDonut bookings={data.bookings} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <RegionalPerformance bookings={data.bookings} />
          <div>
            <h2 className="text-lg font-bold text-[#0c3b24] mb-3">Contractor status</h2>
            <ContractorStatus partners={data.partners} bookings={data.bookings} />
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#0c3b24] mb-3">Open a tool</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HUBS.map((h) => (
            <Link key={h.to} to={h.to} className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-5 hover:border-[#1d9e56] transition-colors">
              <div className="flex items-center gap-2">
                <h.icon className="w-4 h-4 text-[#1d9e56]" />
                <span className="font-bold text-[#0c3b24]">{h.label}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{h.desc}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}