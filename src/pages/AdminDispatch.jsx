import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import DispatchMap from "@/components/admin/DispatchMap";
import {
  Loader2, Phone, MapPin, PackageCheck, ArrowUpDown, X, CalendarClock, UserPlus, MessageSquareText,
} from "lucide-react";

const PARTNER_SHARE = 0.75;
const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const ACTIVE_STATUSES = ["new", "confirmed", "scheduled"];
const STATUS_ORDER = ["new", "confirmed", "scheduled", "completed", "cancelled"];
const STATUS_LABELS = { new: "Request Received", confirmed: "Confirmed", scheduled: "Scheduled", completed: "Completed", cancelled: "Cancelled" };
const ASSIGN_STATES = ["unassigned", "declined", "", null, undefined];

const badge = (a) => {
  const styles = {
    unassigned: "bg-slate-100 text-slate-600",
    assigned: "bg-amber-100 text-amber-700",
    accepted: "bg-[#187B65]/15 text-[#187B65]",
    declined: "bg-red-100 text-red-700",
    completed: "bg-[#102B2A]/10 text-[#102B2A]",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${styles[a] || styles.unassigned}`}>{a || "unassigned"}</span>;
};

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
  const [modal, setModal] = useState(null); // { mode: 'assign'|'reschedule'|'sms', booking }
  const [partnerSel, setPartnerSel] = useState("");
  const [value, setValue] = useState("");
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

  useEffect(() => { loadQueue(); }, []);
  useEffect(() => { load(true); }, [query]);

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

  const assign = async () => {
    const b = modal?.booking;
    const p = partners.find((x) => String(x.id) === partnerSel);
    if (!b || !p) return;
    setBusy(true);
    await base44.entities.Booking.update(b.id, {
      assignment_status: "assigned",
      partner_id: p.id,
      partner_name: p.name,
      job_value: Number(value) || 0,
    });
    setBusy(false);
    closeModal();
    setPartnerSel("");
    setValue("");
    flash(`Assigned to ${p.name}`);
    refresh();
  };

  const reschedule = async () => {
    const b = modal?.booking;
    if (!b || !newDate) return;
    setBusy(true);
    await base44.entities.Booking.update(b.id, { preferred_date: newDate });
    setBusy(false);
    closeModal();
    setNewDate("");
    flash("Job rescheduled");
    refresh();
  };

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

  const cityPartners = (b) => partners.filter((p) => p.city === b.city && p.active !== false);
  const optionsFor = (b) => (cityPartners(b).length ? cityPartners(b) : partners);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Jobs &amp; Dispatch</h1>
          <p className="text-sm text-slate-500 mt-1">Assign partners, reschedule, complete jobs and message customers</p>
        </div>
      </div>

      {notice && <div className="rounded-xl bg-[#187B65]/10 text-[#187B65] px-4 py-2.5 text-sm font-bold">{notice}</div>}

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
                  {badge(b.assignment_status)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city || "unknown city"} · {b.preferred_date || "no date"}</div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.items_description}</p>
                <button
                  onClick={() => { setModal({ mode: "assign", booking: b }); setPartnerSel(""); setValue(b.job_value ? String(b.job_value) : ""); }}
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
                {th("preferred_date", "Service date")}
                {th("partner_name", "Partner")}
                {th("job_value", "Value")}
                {th("status", "Status")}
                <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((b) => (
                <tr key={b.id} className="hover:bg-[#f6f8f7]/60">
                  <td className="px-3 py-3">
                    <div className="font-bold text-[#102B2A]">{b.name}</div>
                    <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-xs text-[#187B65] font-semibold"><Phone className="w-3 h-3" />{b.phone}</a>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{b.city || "—"}</td>
                  <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                    {b.preferred_date || "no date"}
                    {b.time_window && <div className="text-xs text-slate-400">{b.time_window}</div>}
                  </td>
                  <td className="px-3 py-3">
                    {b.partner_name ? <span className="text-slate-700 font-semibold">{b.partner_name}</span> : badge(b.assignment_status)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[#102B2A]">{b.job_value ? money(b.job_value) : "—"}</td>
                  <td className="px-3 py-3">{statusSelect(b)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {ASSIGN_STATES.includes(b.assignment_status) && b.status !== "cancelled" && (
                        <button onClick={() => { setModal({ mode: "assign", booking: b }); setPartnerSel(""); setValue(b.job_value ? String(b.job_value) : ""); }} className="rounded-lg bg-[#102B2A] text-white px-2.5 py-1.5 text-xs font-bold hover:bg-[#0a3020]">Assign</button>
                      )}
                      <button onClick={() => setModal({ mode: "reschedule", booking: b })} className="rounded-lg border border-slate-200 text-slate-600 px-2.5 py-1.5 text-xs font-bold hover:border-[#187B65]">Reschedule</button>
                      {b.status !== "completed" && b.status !== "cancelled" && (
                        <button onClick={() => updateStatus(b, "completed")} className="rounded-lg bg-[#187B65] text-[#102B2A] px-2.5 py-1.5 text-xs font-bold hover:bg-[#125C4E]">Complete</button>
                      )}
                      <button onClick={() => { setModal({ mode: "sms", booking: b }); setSmsMsg("Same Day Recycling: your removal crew is on the way for today's pickup. Reply here or call (604) 849-1745."); }} className="rounded-lg border border-[#187B65] text-[#187B65] px-2.5 py-1.5 text-xs font-bold hover:bg-[#187B65]/10" aria-label={`Text ${b.name}`}>
                        <MessageSquareText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
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
                <span className="font-bold text-[#102B2A]">{b.name}</span>
                {statusSelect(b)}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-[#187B65] font-semibold"><Phone className="w-3 h-3" />{b.phone}</a>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.city || "—"}</span>
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{b.preferred_date || "no date"}</span>
                {badge(b.assignment_status)}
                {b.job_value ? <span className="font-bold text-[#102B2A]">{money(b.job_value)}</span> : null}
              </div>
              <p className="text-xs text-slate-500 mt-2">{b.address}</p>
              <p className="text-xs text-slate-500 mt-1">{b.items_description}</p>
              {b.partner_name && <p className="text-xs text-slate-400 mt-1">Partner: {b.partner_name}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {ASSIGN_STATES.includes(b.assignment_status) && b.status !== "cancelled" && (
                  <button onClick={() => { setModal({ mode: "assign", booking: b }); setPartnerSel(""); setValue(b.job_value ? String(b.job_value) : ""); }} className="rounded-full bg-[#102B2A] text-white px-4 py-2 text-xs font-bold">Assign</button>
                )}
                <button onClick={() => setModal({ mode: "reschedule", booking: b })} className="rounded-full border border-slate-200 text-slate-600 px-4 py-2 text-xs font-bold">Reschedule</button>
                {b.status !== "completed" && b.status !== "cancelled" && (
                  <button onClick={() => updateStatus(b, "completed")} className="rounded-full bg-[#187B65] text-[#102B2A] px-4 py-2 text-xs font-bold">Complete</button>
                )}
                <button onClick={() => { setModal({ mode: "sms", booking: b }); setSmsMsg("Same Day Recycling: your removal crew is on the way for today's pickup. Reply here or call (604) 849-1745."); }} className="rounded-full border border-[#187B65] text-[#187B65] px-4 py-2 text-xs font-bold">Text</button>
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

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#102B2A]/40" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#102B2A]">
                {modal.mode === "assign" ? "Assign to partner" : modal.mode === "reschedule" ? "Reschedule job" : "Text customer"}
              </h3>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{modal.booking.name} · {modal.booking.city || "unknown city"} · {modal.booking.preferred_date || "no date"}</p>

            {modal.mode === "assign" && (
              <div className="space-y-3">
                <label className="block">
                  <span className="block text-xs font-semibold text-[#102B2A] mb-1">
                    Partner {cityPartners(modal.booking).length === 0 && "(none in this city — showing all)"}
                  </span>
                  <select value={partnerSel} onChange={(e) => setPartnerSel(e.target.value)} className="input py-2.5">
                    <option value="">Select partner…</option>
                    {optionsFor(modal.booking).map((p) => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-semibold text-[#102B2A] mb-1">Job value $</span>
                  <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="input py-2.5" />
                </label>
                <div className="flex gap-2 pt-1">
                  <button onClick={assign} disabled={busy || !partnerSel} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">{busy ? "Assigning…" : "Assign job"}</button>
                  <button onClick={closeModal} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
                </div>
              </div>
            )}

            {modal.mode === "reschedule" && (
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
            )}

            {modal.mode === "sms" && (
              <div className="space-y-3">
                <textarea value={smsMsg} onChange={(e) => setSmsMsg(e.target.value)} rows={3} maxLength={320} className="input text-sm" aria-label="Text message" />
                <div className="flex gap-2">
                  <button onClick={sendSms} disabled={busy} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">{busy ? "Sending…" : "Send text"}</button>
                  <button onClick={closeModal} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}