import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { SOURCE_LABELS } from "@/lib/feeRules";

const COLORS = ["#187B65", "#102B2A", "#54D9AE", "#c9971f", "#94a3b8"];

export default function RevenueCharts({ data }) {
  const r = data.revenue;
  const mix = [
    { name: "Job commissions", value: r.job_commissions },
    { name: "Platform fees", value: r.platform_fees },
    { name: "Membership", value: r.membership_mrr },
    { name: "Software subs", value: r.software_mrr },
    { name: "Software setup", value: r.software_setup_collected },
  ].filter((m) => m.value > 0);

  const provinces = (data.by_province || []).slice(0, 12);
  const sources = (data.by_source || []).map((s) => ({ name: SOURCE_LABELS[s.source] || s.source, value: s.earned })).filter((s) => s.value > 0);

  return (
    <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-3">Revenue mix</h3>
        {mix.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">No earned revenue recorded yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {mix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => "$" + Number(v).toFixed(2)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-3">Earned by job source</h3>
        {sources.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">No fees earned by source yet.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl bg-[#f6f8f7] px-4 py-2.5">
                <span className="text-sm font-semibold text-[#102B2A]">{s.name}</span>
                <span className="text-sm font-bold text-[#187B65]">${s.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5 lg:col-span-2">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">Revenue by province / territory</h3>
        <p className="text-xs text-slate-500 mb-3">Gross job value (contractor-facing volume) next to what Same Day Recycling earned.</p>
        {provinces.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">No completed jobs with a province yet.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinces}>
                <XAxis dataKey="province" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => "$" + Number(v).toFixed(2)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="gross" name="Gross job value" fill="#102B2A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="earned" name="Earned by SDR" fill="#187B65" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}