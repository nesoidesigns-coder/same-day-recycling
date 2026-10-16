import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { Loader2, MapPin, Phone, CheckCircle2 } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function AssignTab({ partners }) {
  const [bookings, setBookings] = useState(null);
  const [sel, setSel] = useState({}); // booking_id -> { partner_id, value }

  const load = async () => {
    const { items } = await base44.entities.Booking.filter(
      { assignment_status: { $in: ["unassigned", "declined"] } },
      { sort: "-created_date", limit: 100 }
    );
    setBookings(items);
  };

  useEffect(() => { load(); }, []);

  const grouped = () => {
    const map = {};
    for (const b of bookings || []) {
      const city = b.city || "Unspecified";
      (map[city] = map[city] || []).push(b);
    }
    const known = CITIES.map((c) => c.name).filter((name) => map[name]);
    const extra = Object.keys(map).filter((name) => !CITIES.some((c) => c.name === name));
    return [...known, ...extra].map((city) => ({ city, bookings: map[city] }));
  };

  const cityPartners = (city) => partners.filter((p) => p.city === city && p.active !== false);
  const optionsFor = (b) => {
    const inCity = cityPartners(b.city || "");
    return inCity.length ? inCity : partners.filter((p) => p.active !== false);
  };

  const setField = (id, field, value) => setSel((s) => ({ ...s, [id]: { ...s[id], [field]: value } }));

  const assign = async (b) => {
    const choice = sel[b.id] || {};
    const p = partners.find((x) => String(x.id) === choice.partner_id);
    if (!p) return;
    await base44.entities.Booking.update(b.id, {
      assignment_status: "assigned",
      partner_id: p.id,
      partner_name: p.name,
      job_value: Number(choice.value) || 0,
    });
    setSel((s) => { const next = { ...s }; delete next[b.id]; return next; });
    setBookings((list) => list.filter((x) => x.id !== b.id));
  };

  if (!bookings) return <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-12" />;

  const groups = grouped();
  const total = bookings.length;

  return (
    <div>
      <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-[#0c3b24]">Assign bookings to partners</h2>
        <p className="text-sm text-slate-500 mt-1">
          {total === 0
            ? "Every booking is assigned — nothing waiting."
            : `${total} unassigned booking${total === 1 ? "" : "s"}, grouped by city. Partners are filtered to each booking's city.`}
        </p>
      </div>
      {total === 0 ? null : groups.map((g) => (
        <div key={g.city} className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0c3b24] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1d9e56]" /> {g.city}
            </h3>
            <span className="rounded-full bg-[#f4f7f5] text-[#0c3b24] px-3 py-1 text-xs font-bold">
              {cityPartners(g.city).length} partner{cityPartners(g.city).length === 1 ? "" : "s"} in city
            </span>
          </div>
          <div className="space-y-4">
            {g.bookings.map((b) => {
              const choice = sel[b.id] || {};
              const options = optionsFor(b);
              return (
                <div key={b.id} className="rounded-2xl bg-[#f4f7f5] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#0c3b24]">{b.name}</span>
                    <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-sm text-[#1d9e56] font-semibold">
                      <Phone className="w-3.5 h-3.5" />{b.phone}
                    </a>
                    {b.assignment_status === "declined" && (
                      <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-bold">Declined — reassign</span>
                    )}
                    <span className="text-xs text-slate-500">
                      {b.preferred_date || "no date"}{b.time_window ? ` · ${b.time_window}` : ""}{b.quote_estimate ? ` · quoted ${b.quote_estimate}` : ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5">{b.address}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{b.items_description}</p>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="block flex-1 min-w-52">
                      <span className="block text-xs font-semibold text-[#0c3b24] mb-1">
                        Partner{options.length === 0 ? "" : cityPartners(b.city || "").length ? "" : " (none in city — showing all)"}
                      </span>
                      <select
                        value={choice.partner_id || ""}
                        onChange={(e) => setField(b.id, "partner_id", e.target.value)}
                        className="input py-2.5"
                      >
                        <option value="">Select partner…</option>
                        {options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                    <label className="block w-32">
                      <span className="block text-xs font-semibold text-[#0c3b24] mb-1">Job value $</span>
                      <input
                        type="number"
                        min="0"
                        value={choice.value || ""}
                        onChange={(e) => setField(b.id, "value", e.target.value)}
                        className="input py-2.5"
                      />
                    </label>
                    <button
                      onClick={() => assign(b)}
                      disabled={!choice.partner_id}
                      className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-2.5 hover:bg-[#17a04c] transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Assign
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}