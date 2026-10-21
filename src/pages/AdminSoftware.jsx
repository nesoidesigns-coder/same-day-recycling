import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Cpu, LayoutDashboard, Building2, Activity, DollarSign, Inbox } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import CommandOverview from "@/components/admin/swc/CommandOverview";
import CommandCompanies from "@/components/admin/swc/CommandCompanies";
import CommandOperations from "@/components/admin/swc/CommandOperations";
import CommandRevenue from "@/components/admin/swc/CommandRevenue";
import CommandInquiries from "@/components/admin/swc/CommandInquiries";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "operations", label: "Operations", icon: Activity },
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "inquiries", label: "Inquiries", icon: Inbox },
];

export default function AdminSoftware() {
  const [tab, setTab] = useState("overview");
  const [licenses, setLicenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    const [l, t, cust, pick, inv, inq] = await Promise.all([
      base44.entities.SoftwareLicense.filter({}, { sort: "-created_date", limit: 200 }),
      base44.entities.PaypalTransaction.filter({}, { sort: "-created_date", limit: 200 }),
      base44.entities.LicenseCustomer.filter({}, { limit: 500 }),
      base44.entities.LicensePickup.filter({}, { limit: 500 }),
      base44.entities.LicenseInvoice.filter({}, { limit: 500 }),
      base44.entities.SoftwareInquiry.filter({}, { sort: "-created_date", limit: 200 }),
    ]);
    setLicenses(l.items || l);
    setTransactions(t.items || t);
    setCustomers(cust.items || cust);
    setPickups(pick.items || pick);
    setInvoices(inv.items || inv);
    setInquiries(inq.items || inq);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const periodCutoff = period === "all" ? "" : new Date(Date.now() - Number(period) * 86400000).toISOString().slice(0, 10);
  const periodTransactions = periodCutoff
    ? transactions.filter((t) => (t.created_date || "").slice(0, 10) >= periodCutoff)
    : transactions;
  const newLicenses = periodCutoff
    ? licenses.filter((l) => (l.created_date || "").slice(0, 10) >= periodCutoff).length
    : licenses.length;
  const PERIODS = [{ key: "7", label: "7 days" }, { key: "30", label: "30 days" }, { key: "90", label: "90 days" }, { key: "all", label: "All time" }];

  const setLicenseStatus = async (id, status) => {
    setBusyId(id);
    await base44.entities.SoftwareLicense.update(id, { status });
    await load();
    setBusyId(null);
  };

  const copyPayLink = async (c) => {
    let token = c.pay_token;
    if (!token) {
      token = crypto.randomUUID();
      await base44.entities.SoftwareLicense.update(c.id, { pay_token: token });
    }
    const url = `${window.location.origin}/software-pay?pay=${token}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt("Copy this payment link:", url); }
    setCopiedId(c.id);
    await load();
    setTimeout(() => setCopiedId(null), 2500);
  };

  const setInquiryStatus = async (id, status) => {
    setBusyId(id);
    await base44.entities.SoftwareInquiry.update(id, { status });
    await load();
    setBusyId(null);
  };

  const cancelSubscription = async (c) => {
    setBusyId(c.id);
    try {
      await base44.functions.invoke("paypalCheckout", { action: "cancel_subscription", subscription_id: c.paypal_subscription_id });
    } catch (e) {
      window.alert(e?.response?.data?.error || "Could not cancel the PayPal subscription.");
    }
    await load();
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="admin-console min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#187B65] animate-spin" />
      </div>
    );
  }

  return (
    <div className="admin-console text-white min-h-screen">
      <TopBar />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-[#187B65]/15 text-[#187B65] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight admin-headline">Software Command Centre</h1>
            <p className="text-sm text-emerald-100/60">National operations intelligence across every licensed company instance</p>
          </div>
          <Link to="/software" className="ml-auto hidden sm:inline-block rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-5 py-2 text-sm hover:bg-[#187B65]/10 transition-colors">
            Sales page &rarr;
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-100/40 mr-1">Period</span>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors border ${
                period === p.key
                  ? "bg-[#187B65] text-[#102B2A] border-[#187B65]"
                  : "border-[#187B65]/25 text-emerald-100/60 hover:text-[#54D9AE] hover:bg-[#187B65]/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors border ${
                tab === t.key
                  ? "bg-[#187B65] text-[#102B2A] border-[#187B65]"
                  : "bg-transparent text-emerald-100/60 border-[#187B65]/25 hover:text-[#54D9AE] hover:bg-[#187B65]/10"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <CommandOverview licenses={licenses} transactions={periodTransactions} customers={customers} pickups={pickups} invoices={invoices} newLicenses={newLicenses} />}
        {tab === "companies" && <CommandCompanies licenses={licenses} busyId={busyId} copiedId={copiedId} onCopyPayLink={copyPayLink} onCancelSubscription={cancelSubscription} onStatusChange={setLicenseStatus} />}
        {tab === "operations" && <CommandOperations licenses={licenses} customers={customers} pickups={pickups} invoices={invoices} />}
        {tab === "revenue" && <CommandRevenue licenses={licenses} transactions={periodTransactions} />}
        {tab === "inquiries" && <CommandInquiries inquiries={inquiries} busyId={busyId} onStatusChange={setInquiryStatus} />}
      </div>
      <Footer />
    </div>
  );
}