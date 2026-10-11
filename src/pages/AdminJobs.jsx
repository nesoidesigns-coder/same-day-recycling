import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { Loader2, Lock, CheckCircle2, Users, DollarSign, MapPin, Phone, PackageCheck, Plus } from "lucide-react";

const PARTNER_SHARE = 0.75;
const RATE_FIELDS = [
  ["minimum_pickup", "Minimum pickup"],
  ["eighth_truck", "1/8 truck"],
  ["quarter_truck", "1/4 truck"],
  ["half_truck", "1/2 truck"],
  ["three_quarter_truck", "3/4 truck"],
  ["full_truck", "Full truck"],
];
const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const TABS = ["Jobs", "Partners", "Payouts", "City pricing"];

export default function AdminJobs() {
  const [role, setRole] = useState("loading");
  const [tab, setTab] = useState("Jobs");
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setRole(me?.role || "user");
      } catch {
        setRole("none");
      }
    })();
  }, []);

  const loadPartners = async () => {
    const { items } = await base44.entities.Partner.filter({}, { sort: "-created_date", limit: 100 });
    setPartners(items);
  };

  useEffect(() => {
    if (role === "admin") loadPartners();
  }, [role]);

  if (role === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
      </div>
    );
  }
  if (role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <Lock className="w-10 h-10 text-[#1d9e56]" />
        <h1 className="text-2xl font-bold text-[#0c3b24]">Admins only</h1>
        <p className="text-slate-600">You need an admin account to manage dispatch.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-2">Admin</div>
            <h1 className="text-3xl font-bold text-[#0c3b24]">Dispatch &amp; payouts</h1>
          </div>
          <Link to="/admin" className="text-sm font-semibold text-[#1d9e56] hover:underline">Default pricing →</Link>
        </div>
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${tab === t ? "bg-[#0c3b24] text-white" : "bg-white text-[#0c3b24] border border-slate-200 hover:border-[#1d9e56]"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "Jobs" && <JobsTab partners={partners} />}
        {tab === "Partners" && <PartnersTab partners={partners} reload={loadPartners} />}
        {tab === "Payouts" && <PayoutsTab />}
        {tab === "City pricing" && <CityPricingTab />}
      </div>
    </div>
  );
}

function JobsTab({ partners }) {
  const [cityFilter, setCityFilter] = useState("");
  const [bookings, setBookings] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignFor, setAssignFor] = useState(null);
  const [partnerSel, setPartnerSel] = useState("");
  const [value, setValue] = useState("");

  const query = cityFilter ? { city: cityFilter } : {};

  const load = async (reset) => {
    setLoading(true);
    const opts = { sort: "-created_date", limit: 50 };
    if (!reset && cursor) opts.cursor = cursor;
    const page = await base44.entities.Booking.filter(query, opts);
    setBookings(reset ? page.items : [...bookings, ...page.items]);
    setCursor(page.next_cursor);
    setLoading(false);
  };

  useEffect(() => {
    setCursor(null);
    load(true);
  }, [cityFilter]);

  const assign = async (b) => {
    const p = partners.find((x) => String(x.id) === partnerSel);
    if (!p) return;
    await base44.entities.Booking.update(b.id, {
      assignment_status: "assigned",
      partner_id: p.id,
      partner_name: p.name,
      job_value: Number(value) || 0,
    });
    setAssignFor(null);
    setPartnerSel("");
    setValue("");
    setCursor(null);
    load(true);
  };

  const cityPartners = (b) => partners.filter((p) => p.city === b.city && p.active !== false);
  const optionsFor = (b) => {
    const inCity = cityPartners(b);
    return inCity.length ? inCity : partners;
  };

  const badge = (a) => {
    const styles = {
      unassigned: "bg-slate-100 text-slate-600",
      assigned: "bg-amber-100 text-amber-700",
      accepted: "bg-[#1d9e56]/15 text-[#1d9e56]",
      declined: "bg-red-100 text-red-700",
      completed: "bg-[#0c3b24]/10 text-[#0c3b24]",
    };
    return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${styles[a] || styles.unassigned}`}>{a}</span>;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-semibold text-[#0c3b24]">Filter by city</span>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input w-48 py-2">
          <option value="">All cities</option>
          {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      {loading && !bookings.length ? (
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-12" />
      ) : bookings.length === 0 ? (
        <p className="text-slate-500 text-center py-12">No bookings{cityFilter ? ` in ${cityFilter}` : ""} yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-3xl bg-white border border-slate-100 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#0c3b24]">{b.name}</span>
                    <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-sm text-[#1d9e56] font-semibold"><Phone className="w-3.5 h-3.5" />{b.phone}</a>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin className="w-3.5 h-3.5" />{b.city || "—"}</span>
                    {badge(b.assignment_status || "unassigned")}
                  </div>
                  <p className="text-sm text-slate-600 mt-2 max-w-xl">{b.address}</p>
                  <p className="text-sm text-slate-500 mt-1">{b.items_description}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {b.preferred_date || "no date"}{b.time_window ? ` · ${b.time_window}` : ""}{b.quote_estimate ? ` · quoted ${b.quote_estimate}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400 font-semibold">Job value</div>
                  <div className="text-xl font-bold text-[#0c3b24]">{b.job_value ? money(b.job_value) : "—"}</div>
                  {b.partner_name && <div className="text-xs text-slate-500 mt-1">{b.partner_name}</div>}
                </div>
              </div>
              {(b.assignment_status || "unassigned") !== "completed" && (
                assignFor === b.id ? (
                  <div className="mt-4 rounded-2xl bg-[#f4f7f5] p-4 flex flex-wrap items-end gap-3">
                    <label className="block flex-1 min-w-48">
                      <span className="block text-xs font-semibold text-[#0c3b24] mb-1">Partner{cityPartners(b).length ? "" : " (none in city)"}</span>
                      <select value={partnerSel} onChange={(e) => setPartnerSel(e.target.value)} className="input py-2.5">
                        <option value="">Select partner…</option>
                        {optionsFor(b).map((p) => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
                      </select>
                    </label>
                    <label className="block w-32">
                      <span className="block text-xs font-semibold text-[#0c3b24] mb-1">Job value $</span>
                      <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="input py-2.5" />
                    </label>
                    <button onClick={() => assign(b)} className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-2.5 hover:bg-[#17a04c] transition-colors text-sm">
                      Assign job
                    </button>
                    <button onClick={() => setAssignFor(null)} className="rounded-full bg-white border border-slate-200 text-slate-600 font-bold px-5 py-2.5 text-sm">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAssignFor(b.id); setPartnerSel(""); setValue(b.job_value ? String(b.job_value) : ""); }}
                    className="mt-4 rounded-full bg-[#0c3b24] text-white font-bold px-5 py-2.5 hover:bg-[#0a3020] transition-colors text-sm"
                  >
                    {b.assignment_status === "declined" ? "Reassign job" : b.assignment_status === "assigned" ? "Change assignment" : "Assign to partner"}
                  </button>
                )
              )}
              {b.assignment_status === "completed" && (
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
                  <PackageCheck className="w-4 h-4 text-[#1d9e56]" />
                  <span className="text-[#0c3b24]">Partner payout {money((Number(b.job_value) || 0) * PARTNER_SHARE)} · Referral {money((Number(b.job_value) || 0) * (1 - PARTNER_SHARE))}</span>
                  {b.payout_paid ? <span className="rounded-full bg-[#1d9e56]/15 text-[#1d9e56] px-3 py-1 text-xs font-bold">Paid</span> : <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">Unpaid</span>}
                </div>
              )}
            </div>
          ))}
          {cursor && (
            <button onClick={() => load(false)} disabled={loading} className="w-full rounded-full bg-white border border-slate-200 text-[#0c3b24] font-bold px-6 py-3 hover:border-[#1d9e56] transition-colors disabled:opacity-60">
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PartnersTab({ partners, reload }) {
  const [form, setForm] = useState({ name: "", email: "", city: "" });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.city) return;
    setSaving(true);
    try {
      await base44.users.inviteUser(form.email.trim(), "user");
    } catch (e) {
      // already invited or already a user — partner record still gets created
    }
    await base44.entities.Partner.create({ name: form.name.trim(), email: form.email.trim(), city: form.city, active: true });
    setForm({ name: "", email: "", city: "" });
    setSaving(false);
    reload();
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="rounded-3xl bg-white border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-[#0c3b24] flex items-center gap-2"><Users className="w-5 h-5 text-[#1d9e56]" /> Partners</h2>
        {partners.length === 0 ? (
          <p className="text-slate-500 text-sm mt-4">No partners yet — add one on the right.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {partners.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-[#f4f7f5] px-4 py-3">
                <div>
                  <div className="font-bold text-[#0c3b24] text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.email}</div>
                </div>
                <span className="rounded-full bg-[#1d9e56]/15 text-[#1d9e56] px-3 py-1 text-xs font-bold">{p.city}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-3xl bg-white border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-[#0c3b24] flex items-center gap-2"><Plus className="w-5 h-5 text-[#1d9e56]" /> Add a partner</h2>
        <p className="text-sm text-slate-500 mt-1">Sends them a login invite, then lists them for dispatch.</p>
        <div className="mt-4 space-y-3">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="Company / partner name" />
          <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" className="input" placeholder="Login email" />
          <select value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="input">
            <option value="">Select their city…</option>
            {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={add} disabled={saving} className="w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {saving ? "Adding…" : "Add partner & send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayoutsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.Booking.aggregate({ query: { assignment_status: "completed" }, groupBy: "partner_name", sum: ["job_value"] });
    const unpaid = await base44.entities.Booking.aggregate({ query: { assignment_status: "completed", payout_paid: false }, groupBy: "partner_name", sum: ["job_value"] });
    const unpaidMap = Object.fromEntries((unpaid.rows || []).map((r) => [r.partner_name, r.sum_job_value]));
    setRows((all.rows || []).map((r) => ({
      partner_name: r.partner_name,
      jobs: r.count,
      revenue: r.sum_job_value || 0,
      unpaid: unpaidMap[r.partner_name] || 0,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (name) => {
    await base44.entities.Booking.updateMany(
      { assignment_status: "completed", payout_paid: false, partner_name: name },
      { $set: { payout_paid: true } }
    );
    load();
  };

  if (loading) return <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-12" />;
  if (!rows.length) return <p className="text-slate-500 text-center py-12">No completed jobs yet — payouts appear here.</p>;

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.partner_name} className="rounded-3xl bg-white border border-slate-100 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0c3b24]">{r.partner_name || "Unassigned"}</h3>
              <p className="text-sm text-slate-500">{r.jobs} completed job{r.jobs === 1 ? "" : "s"}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Revenue</div>
                <div className="font-bold text-[#0c3b24]">{money(r.revenue)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Partner (75%)</div>
                <div className="font-bold text-[#1d9e56]">{money(r.revenue * PARTNER_SHARE)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Referral (25%)</div>
                <div className="font-bold text-[#0c3b24]">{money(r.revenue * (1 - PARTNER_SHARE))}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Unpaid</div>
                <div className="font-bold text-amber-600">{money(r.unpaid * PARTNER_SHARE)}</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => markPaid(r.partner_name)}
            disabled={!r.unpaid}
            className="mt-4 rounded-full bg-[#0c3b24] text-white font-bold px-5 py-2.5 hover:bg-[#0a3020] transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Mark payouts paid
          </button>
        </div>
      ))}
    </div>
  );
}

function CityPricingTab() {
  const [cityKey, setCityKey] = useState("");
  const [values, setValues] = useState(null);
  const [rowId, setRowId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setValues(null);
      setRowId(null);
      let rec = null;
      if (cityKey) {
        const { items } = await base44.entities.PricingSettings.filter({ city: cityKey }, { limit: 1 });
        rec = items[0];
      } else {
        const { items } = await base44.entities.PricingSettings.filter({ $or: [{ city: { $exists: false } }, { city: "" }] }, { limit: 1 });
        rec = items[0];
      }
      if (rec) {
        setRowId(rec.id);
        setValues(Object.fromEntries(RATE_FIELDS.map(([k]) => [k, rec[k] ?? ""])));
      } else {
        setValues(Object.fromEntries(RATE_FIELDS.map(([k]) => [k, ""])));
      }
    })();
  }, [cityKey]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const data = {};
    for (const [k] of RATE_FIELDS) data[k] = Number(values[k]) || 0;
    if (cityKey) data.city = cityKey;
    if (rowId) await base44.entities.PricingSettings.update(rowId, data);
    else await base44.entities.PricingSettings.create(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  if (!values) return <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-12" />;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 max-w-xl">
      <label className="block mb-5">
        <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">City</span>
        <select value={cityKey} onChange={(e) => setCityKey(e.target.value)} className="input">
          <option value="">Default (all cities)</option>
          {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </label>
      <div className="space-y-4">
        {RATE_FIELDS.map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-[#0c3b24]">{label}</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                min="0"
                value={values[key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className="input w-28 text-right"
              />
            </div>
          </label>
        ))}
        <button onClick={save} disabled={saving} className="w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle2 className="w-5 h-5" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : `Save ${cityKey || "default"} rates`}
        </button>
      </div>
    </div>
  );
}