import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Users, CalendarDays, Truck, Receipt, BarChart3, BarChart as BarIcon, Settings } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import GaugeCard from "@/components/admin/gauges/GaugeCard";
import StatCard from "@/components/admin/gauges/StatCard";
import ProgressRing from "@/components/admin/gauges/ProgressRing";
import CustomersTab from "@/components/license/CustomersTab";
import SchedulingTab from "@/components/license/SchedulingTab";
import DispatchTab from "@/components/license/DispatchTab";
import InvoicingTab from "@/components/license/InvoicingTab";
import BrandingTab from "@/components/license/BrandingTab";

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA");
const TABS = [
  { key: "overview", label: "Overview", icon: BarIcon },
  { key: "customers", label: "Customers", icon: Users },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "dispatch", label: "Dispatch", icon: Truck },
  { key: "invoices", label: "Invoicing", icon: Receipt },
  { key: "settings", label: "Settings", icon: Settings },
];

function monthKey(d) { return String(d || "").slice(0, 7); }

export default function CompanyDashboard() {
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [license, setLicense] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [logoUrl, setLogoUrl] = useState(null);

  const load = async () => {
    const me = await base44.auth.me();
    const { items: lic } = await base44.entities.SoftwareLicense.filter({ email: me.email });
    if (!lic || !lic.length) {
      setLicense(null);
      setLoading(false);
      return;
    }
    const l = lic[0];
    setLicense(l);
    const [c, p, i] = await Promise.all([
      base44.entities.LicenseCustomer.filter({}, { sort: "-created_date", limit: 200 }),
      base44.entities.LicensePickup.filter({}, { sort: "-scheduled_date", limit: 300 }),
      base44.entities.LicenseInvoice.filter({}, { sort: "-created_date", limit: 200 }),
    ]);
    setCustomers(c.items || c);
    setPickups(p.items || p);
    setInvoices(i.items || i);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  useEffect(() => {
    (async () => {
      if (!license?.logo_uri) { setLogoUrl(null); return; }
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: license.logo_uri });
        setLogoUrl(signed_url);
      } catch { setLogoUrl(null); }
    })();
  }, [license?.logo_uri]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#187B65] animate-spin" />
      </div>
    );
  }

  if (!license) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-[#102B2A]">No software license on this account</h1>
          <p className="text-slate-500 mt-3">License the Same Day Recycling OS to unlock your company dashboard.</p>
          <Link to="/software" className="inline-block mt-6 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors">Get a license</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!["active", "setup_paid"].includes(license.status)) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-[#102B2A]">License {license.status}</h1>
          <p className="text-slate-500 mt-3">Dashboard access is paused until your license subscription is active.</p>
          <a href={`/software-pay?pay=${license.pay_token}`} className="inline-block mt-6 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors">Renew or complete payment</a>
        </div>
        <Footer />
      </div>
    );
  }

  const completed = pickups.filter((p) => p.status === "completed").length;
  const cancelled = pickups.filter((p) => p.status === "cancelled").length;
  const live = pickups.filter((p) => p.status === "scheduled" || p.status === "dispatched").length;
  const completionRate = completed + cancelled > 0 ? Math.round((completed / (completed + cancelled)) * 100) : 100;
  const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const months = [];
  const now = new Date();
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleString("en-CA", { month: "short" }), pickups: 0, revenue: 0 });
  }
  pickups.forEach((p) => {
    const m = months.find((x) => x.key === monthKey(p.scheduled_date));
    if (m && p.status !== "cancelled") m.pickups += 1;
  });
  invoices.filter((i) => i.status === "paid").forEach((i) => {
    const m = months.find((x) => x.key === monthKey(i.paid_date || i.issued_date));
    if (m) m.revenue += Number(i.amount) || 0;
  });

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt={`${license.brand_name || license.company} logo`} className="w-11 h-11 rounded-xl object-contain bg-white border border-slate-200 p-1" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#102B2A] tracking-tight">{license.brand_name || license.company} · Recycling OS</h1>
              <p className="text-sm text-slate-500">{license.plan} plan · {license.city || "Canada"}{license.province ? `, ${license.province}` : ""}</p>
            </div>
          </div>
          <span
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${license.status === "active" ? "bg-[#187B65]/15 text-[#187B65]" : "bg-amber-100 text-amber-700"}`}
            style={license.status === "active" && license.brand_color ? { backgroundColor: license.brand_color + "22", color: license.brand_color } : undefined}
          >
            {license.status === "active" ? "License active" : "Setup paid — subscription pending"}
          </span>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={tab === t.key
                ? "rounded-full bg-[#102B2A] text-[#187B65] font-bold px-5 py-2 text-sm whitespace-nowrap flex items-center gap-1.5"
                : "rounded-full bg-white text-slate-600 font-medium px-5 py-2 text-sm hover:bg-slate-200 transition-colors whitespace-nowrap flex items-center gap-1.5 border border-slate-100"}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Active customers" value={String(customers.filter((c) => c.active).length)} sub={`${customers.length} all-time`} tone="emerald" />
              <StatCard title="Live jobs" value={String(live)} sub="Scheduled + dispatched" tone="slate" />
              <StatCard title="Completed pickups" value={String(completed)} sub={`${cancelled} cancelled`} tone="cyan" />
              <StatCard title="Revenue collected" value={money(collected)} sub="Invoices marked paid" tone="emerald" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <GaugeCard title="Completion rate" updated="Live">
                <ProgressRing value={completionRate} target={100} display={`${completionRate}%`} label="Completion rate" />
              </GaugeCard>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-[#187B65]" />
                  <div className="text-sm font-bold text-slate-800">Pickup volume — last 6 months</div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={months}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="pickups" fill="#187B65" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "customers" && <CustomersTab license={license} customers={customers} onChanged={load} />}
        {tab === "schedule" && <SchedulingTab license={license} customers={customers} pickups={pickups} onChanged={load} />}
        {tab === "dispatch" && <DispatchTab pickups={pickups} onChanged={load} />}
        {tab === "invoices" && <InvoicingTab license={license} pickups={pickups} invoices={invoices} onChanged={load} />}
        {tab === "settings" && <BrandingTab license={license} onChanged={load} />}
      </div>
      <Footer />
    </div>
  );
}