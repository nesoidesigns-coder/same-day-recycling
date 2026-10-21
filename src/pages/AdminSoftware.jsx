import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Loader2, Building2, TrendingUp, DollarSign, Globe2, Copy, Check,
  XCircle, Cpu, Activity,
} from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import HoloGauge from "@/components/software/HoloGauge";

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA");
const STATUSES = ["provisioning", "setup_paid", "active", "paused", "cancelled"];

export default function AdminSoftware() {
  const [licenses, setLicenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = async () => {
    const [l, t] = await Promise.all([
      base44.entities.SoftwareLicense.filter({}, { sort: "-created_date", limit: 200 }),
      base44.entities.PaypalTransaction.filter({}, { sort: "-created_date", limit: 200 }),
    ]);
    setLicenses(l.items || l);
    setTransactions(t.items || t);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

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
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  const active = licenses.filter((l) => l.status === "active");
  const mrr = active.reduce((s, l) => s + (Number(l.monthly_fee) || 0), 0);
  const setupRevenue = transactions.filter((t) => t.purpose === "license_setup" && t.status === "paid").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const activeSubs = transactions.filter((t) => t.purpose === "license_subscription" && t.status === "active").length;
  const cancelledSubs = transactions.filter((t) => t.purpose === "license_subscription" && t.status === "cancelled").length;
  const ordersPaid = transactions.filter((t) => t.purpose === "license_setup" && t.status === "paid").length;
  const provisioningRate = licenses.length ? Math.round((active.length / licenses.length) * 100) : 0;
  const paymentRate = (ordersPaid + activeSubs) > 0 ? Math.round(((ordersPaid + activeSubs) / Math.max(1, ordersPaid + activeSubs + transactions.filter((t) => t.status === "created" || t.status === "failed" || t.status === "cancelled").length)) * 100) : 0;

  const byProvince = {};
  licenses.forEach((l) => {
    const p = l.province || "Unlisted";
    byProvince[p] = (byProvince[p] || 0) + 1;
  });
  const provinces = Object.entries(byProvince).sort((a, b) => b[1] - a[1]);
  const maxProv = provinces.length ? provinces[0][1] : 1;

  return (
    <div className="admin-console text-white min-h-screen">
      <TopBar />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-2xl bg-[#1d9e56]/15 text-[#1d9e56] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight admin-headline">National Software Console</h1>
            <p className="text-sm text-emerald-100/60">Licensed companies, subscriptions, revenue and system performance</p>
          </div>
          <Link to="/software" className="ml-auto hidden sm:inline-block rounded-full border border-[#1d9e56]/40 text-[#a8f0cc] font-bold px-5 py-2 text-sm hover:bg-[#1d9e56]/10 transition-colors">
            Sales page &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Building2, label: "Licensed companies", value: String(licenses.length), sub: `${active.length} active · ${licenses.filter((l) => l.status === "provisioning").length} provisioning` },
            { icon: TrendingUp, label: "Monthly recurring", value: money(mrr), sub: `${activeSubs} verified subscription${activeSubs === 1 ? "" : "s"}` },
            { icon: DollarSign, label: "Setup revenue", value: money(setupRevenue), sub: `${ordersPaid} setup payment${ordersPaid === 1 ? "" : "s"}` },
            { icon: Activity, label: "Subscriptions", value: String(activeSubs), sub: `${cancelledSubs} cancelled` },
          ].map((g) => (
            <div key={g.label} className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-5">
              <div className="flex items-center gap-2">
                <g.icon className="w-4 h-4 text-[#1d9e56]" />
                <div className="text-xs font-bold tracking-wide text-emerald-100/60 uppercase">{g.label}</div>
              </div>
              <div className="text-2xl font-bold text-[#a8f0cc] mt-2 holo-glow-text">{g.value}</div>
              <div className="text-xs text-emerald-100/50 mt-1">{g.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          <div className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-6 flex items-center justify-center">
            <HoloGauge value={provisioningRate} label="Provisioning rate" sub="Active licenses" />
          </div>
          <div className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-6 flex items-center justify-center">
            <HoloGauge value={paymentRate} label="Payment success" sub="Setup + subscriptions" />
          </div>
          <div className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-4 h-4 text-[#1d9e56]" />
              <div className="text-sm font-bold text-[#a8f0cc]">Geographic coverage</div>
            </div>
            {provinces.length === 0 ? (
              <p className="text-sm text-emerald-100/50">No licensed companies yet.</p>
            ) : (
              <div className="space-y-2.5">
                {provinces.map(([p, n]) => (
                  <div key={p} className="flex items-center gap-3">
                    <span className="w-16 text-xs font-bold text-emerald-100/70">{p}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[#1d9e56]/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#1d9e56] network-pulse" style={{ width: `${(n / maxProv) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#a8f0cc] w-6 text-right">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="text-sm font-bold tracking-wide text-emerald-100/60 uppercase mb-3">Licensed companies ({licenses.length})</h2>
        <div className="space-y-3">
          {licenses.length === 0 && (
            <div className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-10 text-center text-emerald-100/50">
              <Building2 className="w-8 h-8 mx-auto text-emerald-100/20" />
              <p className="mt-3">No licenses yet — sales from the software page appear here.</p>
            </div>
          )}
          {licenses.map((c) => (
            <div key={c.id} className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#a8f0cc] text-lg">{c.company}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${c.status === "active" ? "bg-[#1d9e56]/20 text-[#1d9e56]" : c.status === "cancelled" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>{c.status}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-[#0c3b24] text-[#1d9e56] px-2.5 py-0.5 border border-[#1d9e56]/30">{c.plan}</span>
                  </div>
                  <div className="text-sm text-emerald-100/60 mt-1">{c.contact_name} · {c.email}{c.city ? ` · ${c.city}, ${c.province || ""}` : ""}</div>
                  <div className="text-xs text-emerald-100/40 mt-1">Setup {money(c.setup_fee)} · {money(c.monthly_fee)}/mo{c.provisioned_date ? ` · provisioned ${c.provisioned_date}` : ""}</div>
                  {c.notes && <p className="text-xs text-amber-300/80 mt-1">{c.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => copyPayLink(c)} disabled={busyId === c.id} className="rounded-full border border-[#1d9e56]/40 text-[#a8f0cc] px-4 py-2 text-xs font-bold hover:bg-[#1d9e56]/10 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === c.id ? "Copied" : c.pay_token ? "Payment link" : "Create payment link"}
                  </button>
                  {c.paypal_subscription_id && c.status === "active" && (
                    <button onClick={() => cancelSubscription(c)} disabled={busyId === c.id} className="rounded-full bg-red-500/20 text-red-300 px-4 py-2 text-xs font-bold hover:bg-red-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                      <XCircle className="w-3.5 h-3.5" /> Cancel sub
                    </button>
                  )}
                  <select value={c.status} onChange={(e) => setLicenseStatus(c.id, e.target.value)} disabled={busyId === c.id} className="rounded-xl bg-[#06251b] border border-[#1d9e56]/30 px-3 py-2 text-xs font-bold text-[#a8f0cc]">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}