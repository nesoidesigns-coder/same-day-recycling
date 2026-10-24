import { AlertTriangle, BarChart3, Coins, GraduationCap, History, Loader2, Recycle, Truck, Users, Wallet } from 'lucide-react';
import {
  Bar, ComposedChart, CartesianGrid, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }));
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA'));

const KPI = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-4">
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      <Icon className="w-3.5 h-3.5 text-[#187B65]" /> {label}
    </div>
    <div className="mt-1.5 text-xl font-extrabold text-[#102B2A] tabular-nums">{value}</div>
    {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
  </div>
);

const Table = ({ title, rows, cols }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-4">
    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</div>
    {(rows || []).length === 0 ? (
      <p className="text-xs text-slate-500">No records yet — this fills in as completed jobs are recorded.</p>
    ) : (
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-400">
            {cols.map((c) => <th key={c.key} className="pb-1 font-bold uppercase tracking-wide">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-200">
              {cols.map((c) => <td key={c.key} className="py-1.5 font-semibold text-[#102B2A]">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default function LifetimePanels({ data, loading, error }) {
  if (loading) return <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Calculating lifetime totals…</div>;
  if (error) return <p role="alert" className="py-8 text-sm text-red-600">{error?.response?.data?.error || 'Lifetime data could not be loaded right now.'}</p>;
  if (!data) return null;
  const L = data.lifetime || {};
  const estimate = L.revenue_basis === 'booking_estimate';

  return (
    <div className="space-y-5">
      {estimate && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{data.basis_note}</span>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Lifetime totals — since {data.inception_date || 'business inception'}</h2>
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI icon={Coins} label="Total revenue" value={money(L.total_revenue)} sub={estimate ? 'Estimate from bookings' : 'Verified ledger'} />
          <KPI icon={Wallet} label="Commissions earned" value={money(L.commissions)} sub={estimate ? 'From completed jobs' : 'Verified ledger'} />
          <KPI icon={Recycle} label="Recycling OS revenue" value={money(L.os_software_revenue)} sub="Subscriptions, memberships, setup" />
          <KPI icon={Coins} label="Expenses paid" value={money(L.expenses_paid)} sub={money(L.payable) !== '—' ? `${money(L.payable)} outstanding (A/P)` : null} />
          <KPI icon={BarChart3} label="Gross profit" value={money(L.gross_profit)} sub="Revenue − contractor payouts" />
          <KPI icon={Coins} label="Est. net profit" value={money(L.net_profit_estimate)} sub="Gross profit − expenses" />
          <KPI icon={Truck} label="Completed jobs" value={num(L.completed_jobs)} sub={`${num(L.total_bookings)} total requests · ${num(L.unique_customers)} customers`} />
          <KPI icon={Users} label="Contractors" value={num(L.active_contractors)} sub={`${num(L.total_contractors)} on record · ${num(L.active_contractors)} active`} />
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Monthly financial trend</h2>
        {(data.monthly || []).length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No dated revenue or expense records yet.</p>
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthly} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#187B65" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Line dataKey="commissions" name="Commissions" stroke="#102B2A" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
        {(data.yearly || []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.yearly.map((y) => (
              <span key={y.year} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#102B2A]">
                {y.year}: {money(y.revenue)} revenue · {money(y.expenses)} expenses
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Table title="Revenue by city (completed jobs)" rows={data.by_city} cols={[
          { key: 'city', label: 'City' },
          { key: 'completed', label: 'Jobs', render: (r) => num(r.completed) },
          { key: 'revenue', label: 'Job value', render: (r) => money(r.revenue) },
          { key: 'commission', label: 'Commission', render: (r) => money(r.commission) },
        ]} />
        <Table title="Revenue by province (completed jobs)" rows={data.by_province} cols={[
          { key: 'province', label: 'Province' },
          { key: 'completed', label: 'Jobs', render: (r) => num(r.completed) },
          { key: 'revenue', label: 'Job value', render: (r) => money(r.revenue) },
        ]} />
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Contractor performance (lifetime)</h2>
        <div className="mt-3">
          <Table title="" rows={data.contractors} cols={[
            { key: 'name', label: 'Contractor' },
            { key: 'assigned', label: 'Jobs assigned', render: (r) => num(r.assigned) },
            { key: 'completed', label: 'Completed', render: (r) => num(r.completed) },
            { key: 'revenue', label: 'Job value', render: (r) => money(r.revenue) },
            { key: 'commission', label: 'Commission to OS', render: (r) => money(r.commission) },
            { key: 'last', label: 'Last activity', render: (r) => (r.last ? String(r.last).slice(0, 10) : '—') },
          ]} />
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[#187B65]" /> Business timeline — milestones, decisions & lessons
        </h2>
        {(data.timeline || []).length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No milestones recorded yet. Add them in the Business Memory tab — every milestone builds the permanent history.</p>
        ) : (
          <ol className="mt-4 space-y-3 border-l-2 border-[#187B65]/30 pl-4">
            {data.timeline.map((t) => (
              <li key={t.id} className="relative">
                <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-[#187B65]" />
                <div className="text-xs font-bold text-[#102B2A]">{t.title}</div>
                <div className="text-[11px] text-slate-400">{t.entry_date} · {String(t.entry_type || '').replace(/_/g, ' ')}</div>
                {t.detail && <p className="mt-1 text-xs text-slate-600">{t.detail}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}