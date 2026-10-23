import { CATEGORY_LABELS, PROVINCES } from "@/lib/demandShared";

const PROV_NAMES = Object.fromEntries(PROVINCES);

// Filter bar for the Demand Dashboard: province, city, service category and
// data-period range. City options are already narrowed to the province.
export default function DashboardFilters({ provinces, cities, periods, filters, setFilters }) {
  const set = (key) => (value) =>
    setFilters((f) => ({ ...f, [key]: value, ...(key === "province" ? { city: "" } : {}) }));

  const selectClass =
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#102B2A] focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/25";

  const active =
    filters.province || filters.city || filters.category !== "all" || filters.periodFrom || filters.periodTo;

  return (
    <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-4 mb-6">
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
        Filters — provinces, cities, services &amp; date range
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <select aria-label="Province filter" className={selectClass} value={filters.province} onChange={(e) => set("province")(e.target.value)}>
          <option value="">All Canada</option>
          {provinces.map((code) => (
            <option key={code} value={code}>{PROV_NAMES[code] || code}</option>
          ))}
        </select>

        <select aria-label="City filter" className={selectClass} value={filters.city} onChange={(e) => set("city")(e.target.value)}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.key} value={c.key}>{c.key}{c.province_code ? `, ${c.province_code}` : ""}</option>
          ))}
        </select>

        <select aria-label="Service category filter" className={selectClass} value={filters.category} onChange={(e) => set("category")(e.target.value)}>
          <option value="all">All services</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select aria-label="Period from" className={selectClass} value={filters.periodFrom} onChange={(e) => set("periodFrom")(e.target.value)}>
          <option value="">From: first period</option>
          {periods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select aria-label="Period to" className={selectClass} value={filters.periodTo} onChange={(e) => set("periodTo")(e.target.value)}>
          <option value="">To: latest period</option>
          {periods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {active && (
        <button
          onClick={() => setFilters({ province: "", city: "", category: "all", periodFrom: "", periodTo: "" })}
          className="mt-3 text-xs font-bold text-[#187B65] hover:underline"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}