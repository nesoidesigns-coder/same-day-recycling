import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import DispatchMap from "@/components/admin/DispatchMap";
import AssignModal from "@/components/admin/dispatch/AssignModal";
import ScheduleModal from "@/components/admin/dispatch/ScheduleModal";
import CompleteModal from "@/components/admin/dispatch/CompleteModal";
import PaidModal from "@/components/admin/dispatch/PaidModal";
import CommissionSummary from "@/components/admin/dispatch/CommissionSummary";
import {
  Loader2, Phone, MapPin, ArrowUpDown, X, CalendarClock, UserPlus, MessageSquareText,
  Camera, ShieldCheck, ShieldAlert, Copy,
} from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const ACTIVE_STATUSES = ["new", "confirmed", "scheduled"];
const STATUS_ORDER = ["new", "confirmed", "scheduled", "completed", "cancelled"];
const STATUS_LABELS = { new: "Request Received", confirmed: "Confirmed", scheduled: "Scheduled", completed: "Completed", cancelled: "Cancelled" };
const ASSIGN_STATES = ["unassigned", "declined", "", null, undefined];

const badge = (a) => {
  const styles = {
    unassigned: "bg-slate-100 text-slate-600",
    assigned: "bg-amber-100 text-amber-700",
    accepted: "bg-blue-100 text-blue-700",
    scheduled: "bg-indigo-100 text-indigo-700",
    completed: "bg-[#102B2A]/10 text-[#102B2A]",
    paid: "bg-[#187B65]/15 text-[#187B65]",
    declined: "bg-red-100 text-red-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${styles[a] || styles.unassigned}`}>{a || "unassigned"}</span>;
};

const normContact = (v) => (v || "").toLowerCase().replace(/[^a-z0-9@.]/g, "").trim();

export default function AdminDispatch() {
  const [partners, setPartners] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState(-1);
  const [modal, setModal] = useState(null); // { mode: 'assign'|'schedule'|'complete'|'paid'|'photo'|'sms', booking }
  const [newDate, setNewDate] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadPartners = async () => {
    const { items } = await base44.entities.Partner.filter({}, { sort: "-created_date", limit: 100 });
    setPartners(items);
  };

  const loadQueue = async () => {
    setQueueLoading(true);
    const page = await base44.entities.Booking.filter(
      {
        status: { $in: ACTIVE_STATUSES },
        $or: [{ assignment_status: { $in: ["unassigned", "declined"] } }, { assignment_status: { $exists: false } }],
      },
      { sort: "-created_date", limit: 50 }
    );
    setQueue(page.items || []);
    setQueueLoading(false);
  };

  const query = useMemo(() => {
    const q = {};
    if (cityFilter) q.city = cityFilter;
    if (statusFilter) q.status = statusFilter;
    if (partnerFilter) q.partner_name = partnerFilter;
    if (dateFrom || dateTo) {
      q.preferred_date = { ...(dateFrom && { $gte: dateFrom }), ...(dateTo && { $lte: dateTo }) };
    }
    return q;
  }, [cityFilter, statusFilter, partnerFilter, dateFrom, dateTo]);

  const load = async (reset = true) => {
    setLoading(true);
    const opts = { sort: "-created_date", limit: 50 };
    if (!reset && cursor) opts.cursor = cursor;
    const page = await base44.entities.Booking.filter(query, opts);
    setBookings(reset ? page.items : [...bookings, ...page.items]);
    setCursor(page.next_cursor);
    setLoading(false);
  };

  useEffect(() => { loadQueue(); loadPartners(); }, []);
  useEffect(() => { load(true); }, [query]);

  // Duplicate customer detection: same phone or email across different bookings
  const duplicateIds = useMemo(() => {
    const byContact = {};
    for (const b of bookings) {
      const keys = [normContact(b.phone), normContact(b.email)].filter(Boolean);
      for (const k of keys) {
        (byContact[k] = byContact[k] || []).push(b.id);
      }
    }
    const dupes = new Set();
    for (const ids of Object.values(byContact)) {
      if (ids.length > 1) ids.forEach((id) => dupes.add(id));
    }
    return dupes;
  }, [bookings]);

  const sorted = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (sortKey === "status") {
        return (STATUS_ORDER.indexOf(av) - STATUS_ORDER.indexOf(bv)) * sortDir;
      }
      if (typeof av === "number" || typeof bv === "number") return ((av || 0) - (bv || 0)) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [bookings, sortKey, sortDir]);

  const refresh = () => { load(true); loadQueue(); loadPartners(); };

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(""), 3000); };
  const closeModal = () => setModal(null);

  const withHistory = (b, patch) => ({
    ...patch,
    status_history: [...(b.status_history || []), { status: patch.assignment_status || patch.status || b.status, date: new Date().toISOString() }],
  });

  const assign = async (payload) => {
    const b = modal?.booking;
    if (!b) return;
    setBusy(true);
    await base44.entities.Booking.update(b.id, withHistory(b, { assignment_status: "assigned", ...payload }));
    setBusy(false);
    closeModal();
    flash(`Assigned to ${payload.partner_name}${payload.referred_by_admin ? ` · referral commission ${payload.commission_rate}%` : ""}`);
    refresh();
  };

  const accept = async (b) => {
    await base44.entities.Booking.update(b.id, withHistory(b, { assignment_status: "accepted" }));
    flash("Partner accepted the job");
    refresh();
  };

  const schedule = async (payload) => {
    const b = modal?.booking;
    if (!b) return;
    setBusy(true);
    await base44.entities.Booking.update(b.id, withHistory(b, { assignment_status: "scheduled", ...payload }));
    setBusy(false);
    closeModal();
    flash(`Pickup confirmed for ${payload.preferred_date}`);
    refresh();
  };

  const complete = async (payload) => {
    const b = modal?.booking;
    if (!b) return;
    setBusy(true);
    await base44.entities.Booking.update(b.id, withHistory(b, {
      assignment_status: "completed",
      status: "completed",
      ...payload,
    }));
    setBusy(false);
    closeModal();
    flash(`Job completed · invoice ${money(payload.final_invoice)}${payload.commission_earned ? ` · commission ${money(payload.commission_earned)} earned` : ""}`);
    refresh();
  };

  const markPaid = async (payload) => {
    const b = modal?.booking;
    if (!b) return;
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);
    const patch = {
      payment_status: payload.customer_paid ? "paid" : b.payment_status,
      commission_paid: (Number(b.commission_paid) || 0) + (payload.commission_paid_amount || 0),
      commission_paid_date: payload.commission_paid_amount ? today : b.commission_paid_date,
    };
    const newOutstanding = Math.max(0, (Number(b.commission_earned) || 0) - patch.commission_paid);
    if (newOutstanding <= 0 && b.assignment_status === "completed") patch.assignment_status = "paid";
    await base44.entities.Booking.update(b.id, patch);
    setBusy(false);
    closeModal();
    flash(`Payments recorded${patch.assignment_status === "paid" ? " · job fully paid" : ""}`);
    refresh();
  };

  const attachPhoto = async (file) => {
    const b = modal?.booking;
    if (!b || !file) return;
    setBusy(true);
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    await base44.entities.Booking.update(b.id, { photo_uri: file_uri });
    setBusy(false);
    closeModal();
    flash("Photo attached");
    refresh();
  };

  const viewPhoto = async (b) => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: b.photo_uri });
    window.open(signed_url, "_blank");
  };

  const togglePartnerVerified = async (p) => {
    await base44.entities.Partner.update(p.id, {
      verified: !p.verified,
      verified_date: !p.verified ? new Date().toISOString().slice(0, 10) : "",
    });
    flash(p.verified ? `${p.name} marked unverified` : `${p.name} verified — now assignable`);
    loadPartners();
  };

  const reschedule = async () => {
    const b = modal?.booking;
    if (!b || !newDate) return;
    setBusy(true);
    await base44.entities.Booking.update(b.id, { preferred_date: newDate, pickup_confirmed: false });
    setBusy(false);
    closeModal();
    setNewDate("");
    flash("Job rescheduled — pickup date needs re-confirmation");
    refresh();
  };

  const sendSms = async () => {
    const b = modal?.booking;
    if (!b) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("sendSmsAlert", { booking_id: b.id, message: smsMsg });
      flash(res.data?.ok ? "Text sent" : "Text failed: " + (res.data?.error || "unknown"));
    } catch (e) {
      flash("Text failed: " + (e?.response?.data?.error || e.message || "failed"));
    } finally {
      setBusy(false);
      closeModal();
    }
  };

  const th = (key, label) => (
    <th className="px-3 py-3 text-left">
      <button
        onClick={() => { if (sortKey === key) setSortDir(-sortDir); else { setSortKey(key); setSortDir(1); } }}
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#102B2A]"
      >
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === key ? "text-[#187B65]" : ""}`} />
      </button>
    </th>
  );

  const statusSelect = (b) => (
    <div className="flex flex-col gap-0.5">
      <select
        value={b.status || "new"}
        onChange={(e) => updateStatus(b, e.target.value)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-[#102B2A] bg-white"
        aria-label="Booking status"
      >
        {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
      {b.status_history?.length > 0 && (
        <span className="text-[10px] text-slate-400">
          {new Date(b.status_history[b.status_history.length - 1].date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}
        </span>
      )}
    </div>
  );

  const updateStatus = async (b, status) => {
    const history = [...(b.status_history || []), { status, date: new Date().toISOString() }];
    await base44.entities.Booking.update(b.id, { status, status_history: history });
    if (status === "completed" && b.status !== status) {
      base44.analytics.track({ eventName: "job_completed", properties: { booking_id: b.id } });
    }
    if ((status === "confirmed" || status === "scheduled") && b.status !== status) {
      try {
        await base44.functions.invoke("addBookingToCalendar", { booking_id: b.id });
      } catch {
        // calendar sync is best-effort — the status change still applies
      }
    }
    flash(`Marked ${status}`);
    refresh();
  };

  const lifecycleButtons = (b, mobile = false) => {
    const cls = mobile ? "rounded-full" : "rounded-lg";
    return (
      <div className={`flex flex-wrap gap-1.5 ${mobile ? "px-4 py-2" : "px-2.5 py-1.5 text-xs"}`}>
        {ASSIGN_STATES.includes(b.assignment_status) && b.status !== "cancelled" && (
          <button onClick={() => setModal({ mode: "assign", booking: b })} className={`${cls} bg-[#102B2A] text-white font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"} hover:bg-[#0a3020]`}>Assign</button>
        )}
        {b.assignment_status === "assigned" && (
          <button onClick={() => accept(b)} className={`${cls} border border-blue-300 text-blue-700 font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"}`}>Accept</button>
        )}
        {["assigned", "accepted"].includes(b.assignment_status) && b.status !== "cancelled" && (
          <button onClick={() => setModal({ mode: "schedule", booking: b })} className={`${cls} border border-indigo-300 text-indigo-700 font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"}`}>Confirm pickup</button>
        )}
        {["assigned", "accepted", "scheduled"].includes(b.assignment_status) && b.status !== "completed" && b.status !== "cancelled" && (
          <button onClick={() => setModal({ mode: "complete", booking: b })} className={`${cls} bg-[#187B65] text-[#102B2A] font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"} hover:bg-[#125C4E]`}>Complete</button>
        )}
        {b.status === "completed" && b.assignment_status !== "paid" && (
          <button onClick={() => setModal({ mode: "paid", booking: b })} className={`${cls} bg-amber-500 text-white font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"}`}>Record payments</button>
        )}
        <button onClick={() => { setModal({ mode: "photo", booking: b }); }} className={`${cls} border border-slate-200 text-slate-600 font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"} hover:border-[#187B65]`}>
          <Camera className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setModal({ mode: "reschedule", booking: b })} className={`${cls} border border-slate-200 text-slate-600 font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"} hover:border-[#187B65]`}>Reschedule</button>
        <button onClick={() => { setModal({ mode: "sms", booking: b }); setSmsMsg("Same Day Recycling: your removal crew is on the way for today's pickup. Reply here or call (604) 849-1745."); }} className={`${cls} border border-[#187B65] text-[#187B65] font-bold ${mobile ? "px-4 py-2 text-xs" : "px-2.5 py-1.5 text-xs"} hover:bg-[#187B65]/10`} aria-label={`Text ${b.name}`}>
          <MessageSquareText className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const commissionCell = (b) => {
    if (!b.referred_by_admin) return <span className="text-slate-300">—</span>;
    const outstanding = Math.max(0, (Number(b.commission_earned) || 0) - (Number(b.commission_paid) || 0));
    return (
      <span className="text-xs font-semibold text-[#102B2A]">
        {money(b.commission_earned || 0)} {outstanding > 0 ? <span className="text-amber-600">({money(outstanding)} due)</span> : <span className="text-[#187B65]">paid</span>}
      </span>
    );
  };

  const dupBadge = (b) => duplicateIds.has(b.id) && (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-[10px] font-bold" title="Same phone or email on another booking — verify before completing or paying commission">
      <Copy className="w-3 h-3" /> Duplicate?
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Jobs &amp; Dispatch</h1>
          <p className="text-sm text-slate-500 mt-1">Assign partners, confirm pickups, complete jobs and track referral commission</p>
        </div>
      </div>

      {notice && <div className="rounded-xl bg-[#187B65]/10 text-[#187B65] px-4 py-2.5 text-sm font-bold">{notice}</div>}

      {/* Dispatch partners + verification */}
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#187B65]" />
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A]">Dispatch partners</h2>
          <span className="text-xs text-slate-400">Only verified partners can receive assignments</span>
        </div>
        {partners.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">No partners yet — add one in Partners, then mark it verified here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {partners.map((p) => (
              <div key={p.id} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${p.verified ? "border-[#187B65]/40 bg-[#f4f7f5]" : "border-amber-200 bg-amber-50"}`}>
                {p.verified ? <ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
                <span className="text-xs font-bold text-[#102B2A]">{p.name}</span>
                <span className="text-[10px] text-slate-400">{p.city}</span>
                <button onClick={() => togglePartnerVerified(p)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.verified ? "text-slate-400 hover:text-red-600" : "text-[#187B65] hover:underline"}`}>
                  {p.verified ? "Unverify" : "Verify"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unassigned queue */}
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-[#187B65]" />
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A]">Assignment queue</h2>
          {queue.length > 0 && <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-bold">{queue.length}</span>}
        </div>
        {queueLoading ? (
          <Loader2 className="w-6 h-6 text-[#187B65] animate-spin my-6" />
        ) : queue.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Queue is clear — every active job has a partner.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {queue.map((b) => (
              <div key={b.id} className="rounded-xl bg-[#f6f8f7] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#102B2A] text-sm truncate">{b.name}</span>
                  <div className="flex items-center gap-1.5">{dupBadge(b)}{badge(b.assignment_status)}</div>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city || "unknown city"} · {b.preferred_date || "no date"}</div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.items_description}</p>
                <button
                  onClick={() => setModal({ mode: "assign", booking: b })}
                  className="mt-3 rounded-full bg-[#102B2A] text-white font-bold px-4 py-2 text-xs hover:bg-[#0a3020] transition-colors"
                >
                  Assign to partner
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DispatchMap bookings={bookings} onSelectCity={(city) => setCityFilter(city === cityFilter ? "" : city)} />

      <CommissionSummary bookings={bookings} />

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4 grid grid-cols-2 md:flex md:flex-wrap gap-3">
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input py-2" aria-label="Filter by city">
          <option value="">All cities</option>
          {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input py-2" aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} className="input py-2" aria-label="Filter by partner">
          <option value="">All partners</option>
          {partners.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          From <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" aria-label="From date" />
        </label>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          To <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" aria-label="To date" />
        </label>
        {(cityFilter || statusFilter || partnerFilter || dateFrom || dateTo) && (
          <button onClick={() => { setCityFilter(""); setStatusFilter(""); setPartnerFilter(""); setDateFrom(""); setDateTo(""); }} className="text-xs font-bold text-[#187B65] px-2 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Jobs table (desktop) */}
      <div className="hidden md:block rounded-2xl bg-white border border-slate-200/70 shadow-sm overflow-x-auto">
        {loading && !bookings.length ? (
          <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-12" />
        ) : bookings.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No jobs match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#f6f8f7] border-b border-slate-100">
              <tr>
                {th("name", "Customer")}
                {th("city", "City")}
                {th("preferred_date", "Pickup date")}
                {th("partner_name", "Partner")}
                {th("job_value", "Estimated")}
                {th("final_invoice", "Invoice")}
                {th("commission_earned", "Commission")}
                {th("status", "Status")}
                <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((b) => (
                <tr key={b.id} className="hover:bg-[#f6f8f7]/60">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#102B2A]">{b.name}</span>
                      {dupBadge(b)}
                    </div>
                    <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-xs text-[#187B65] font-semibold"><Phone className="w-3 h-3" />{b.phone}</a>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{b.city || "—"}</td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                    {b.preferred_date || "no date"}
                    {b.pickup_confirmed ? <span className="block text-[10px] font-bold text-[#187B65]">confirmed</span> : b.time_window && <div className="text-xs text-slate-400">{b.time_window}</div>}
                  </td>
                  <td className="px-3 py-3">
                    {b.partner_name ? <span className="text-slate-700 font-semibold">{b.partner_name}</span> : badge(b.assignment_status)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[#102B2A]">{b.job_value ? money(b.job_value) : "—"}</td>
                  <td className="px-3 py-3 text-slate-600">{b.final_invoice ? money(b.final_invoice) : "—"}</td>
                  <td className="px-3 py-3">{commissionCell(b)}</td>
                  <td className="px-3 py-3">{statusSelect(b)}</td>
                  <td className="px-3 py-3">{lifecycleButtons(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Job cards (mobile) */}
      <div className="md:hidden space-y-3">
        {loading && !bookings.length ? (
          <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-12" />
        ) : bookings.length === 0 ? (
          <p className="text-slate-500 text-center py-12 bg-white rounded-2xl border border-slate-200/70">No jobs match these filters.</p>
        ) : (
          sorted.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#102B2A] truncate">{b.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">{dupBadge(b)}{statusSelect(b)}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-[#187B65] font-semibold"><Phone className="w-3 h-3" />{b.phone}</a>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city || "—"}</span>
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{b.preferred_date || "no date"}{b.pickup_confirmed ? " ✓" : ""}</span>
                {badge(b.assignment_status)}
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold text-[#102B2A]">
                {b.job_value ? <span>Est. {money(b.job_value)}</span> : null}
                {b.final_invoice ? <span>Invoice {money(b.final_invoice)}</span> : null}
                {b.referred_by_admin && <span>Referral {b.commission_rate}%</span>}
                {b.referred_by_admin && <span className="text-[#187B65]">Comm. {money(b.commission_earned || 0)}{Math.max(0, (Number(b.commission_earned) || 0) - (Number(b.commission_paid) || 0)) > 0 ? <span className="text-amber-600"> · {money(Math.max(0, (Number(b.commission_earned) || 0) - (Number(b.commission_paid) || 0)))} due</span> : " paid"}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-2">{b.address}</p>
              <p className="text-xs text-slate-500 mt-1">{b.items_description}</p>
              {b.partner_name && <p className="text-xs text-slate-400 mt-1">Partner: {b.partner_name}</p>}
              <div className="mt-3 -mx-4 -mb-4 border-t border-slate-100 bg-[#fafbfa] rounded-b-2xl">
                {lifecycleButtons(b, true)}
              </div>
            </div>
          ))
        )}
      </div>

      {cursor && (
        <button onClick={() => load(false)} disabled={loading} className="w-full rounded-full bg-white border border-slate-200 text-[#102B2A] font-bold px-6 py-3 hover:border-[#187B65] transition-colors disabled:opacity-60">
          {loading ? "Loading…" : "Load more jobs"}
        </button>
      )}

      {/* Modals */}
      {modal?.mode === "assign" && <AssignModal booking={modal.booking} partners={partners} onClose={closeModal} onAssign={assign} />}
      {modal?.mode === "schedule" && <ScheduleModal booking={modal.booking} onClose={closeModal} onSchedule={schedule} />}
      {modal?.mode === "complete" && <CompleteModal booking={modal.booking} onClose={closeModal} onComplete={complete} />}
      {modal?.mode === "paid" && <PaidModal booking={modal.booking} onClose={closeModal} onPaid={markPaid} />}

      {modal?.mode === "photo" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#102B2A]/40" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#102B2A]">Customer photo</h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{modal.booking.name} · {modal.booking.city || "unknown city"}</p>
            <div className="space-y-3">
              {modal.booking.photo_uri && (
                <button onClick={() => viewPhoto(modal.booking)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-[#187B65] hover:border-[#187B65]">
                  View attached photo
                </button>
              )}
              <label className="block rounded-xl bg-[#f6f8f7] p-4 text-center cursor-pointer">
                <Camera className="w-5 h-5 text-[#187B65] mx-auto mb-1" />
                <span className="text-xs font-semibold text-[#102B2A]">{modal.booking.photo_uri ? "Replace photo" : "Attach photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => attachPhoto(e.target.files?.[0])} />
              </label>
              {busy && <Loader2 className="w-5 h-5 text-[#187B65] animate-spin mx-auto" />}
              <button onClick={closeModal} className="w-full rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Close</button>
            </div>
          </div>
        </div>
      )}

      {modal?.mode === "reschedule" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#102B2A]/40" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#102B2A]">Reschedule job</h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{modal.booking.name} · {modal.booking.city || "unknown city"}</p>
            <div className="space-y-3">
              <label className="block">
                <span className="block text-xs font-semibold text-[#102B2A] mb-1">New service date</span>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input py-2.5" />
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={reschedule} disabled={busy || !newDate} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">{busy ? "Saving…" : "Save date"}</button>
                <button onClick={closeModal} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal?.mode === "sms" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#102B2A]/40" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#102B2A]">Text customer</h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{modal.booking.name} · {modal.booking.city || "unknown city"} · {modal.booking.preferred_date || "no date"}</p>
            <div className="space-y-3">
              <textarea value={smsMsg} onChange={(e) => setSmsMsg(e.target.value)} rows={3} maxLength={320} className="input text-sm" aria-label="Text message" />
              <div className="flex gap-2">
                <button onClick={sendSms} disabled={busy} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">{busy ? "Sending…" : "Send text"}</button>
                <button onClick={closeModal} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}