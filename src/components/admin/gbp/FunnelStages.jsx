import { MapPin, MessageSquare, FileText, CalendarCheck, CheckCircle2, DollarSign, ChevronDown } from 'lucide-react';

const STAGES = [
  { key: 'visits', label: 'Business Profile visits', icon: MapPin, desc: 'Customer visits arriving from your Google Business Profile or Maps listing' },
  { key: 'inquiries', label: 'Customer inquiries', icon: MessageSquare, desc: 'Quote requests and leads from those visits' },
  { key: 'quotes_sent', label: 'Quotes sent', icon: FileText, desc: 'Inquiries that received a quote or direct follow-up' },
  { key: 'booked', label: 'Bookings', icon: CalendarCheck, desc: 'Quotes converted into booked jobs' },
  { key: 'completed', label: 'Jobs completed', icon: CheckCircle2, desc: 'Bookings completed on site' },
];

export default function FunnelStages({ funnel }) {
  const total = STAGES.reduce((s, st) => s + (funnel[st.key] || 0), 0);

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center">
        <MapPin className="w-8 h-8 text-[#187B65] mx-auto" />
        <p className="mt-2 text-sm font-bold text-[#102B2A]">No Google Business Profile activity recorded yet</p>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Visits are attributed automatically when they arrive from your Business Profile or a Maps listing, or from a link ending in <span className="font-bold">?src=gbp</span>. Make sure the website button on your Google Business Profile points at your site with that tag.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {STAGES.map((st, i) => {
        const count = funnel[st.key] || 0;
        const prev = i > 0 ? funnel[STAGES[i - 1].key] || 0 : null;
        const rate = prev && prev > 0 ? Math.round((count / prev) * 100) : null;
        return (
          <div key={st.key}>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-[#187B65]/10 text-[#187B65] flex items-center justify-center"><st.icon className="w-5 h-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#102B2A]">{st.label}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{st.desc}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-[#102B2A]">{count}</p>
                {rate !== null && <p className="text-[10px] font-bold text-slate-500">{rate}% of previous</p>}
              </div>
            </div>
            {i < STAGES.length - 1 && <div className="flex justify-center py-0.5"><ChevronDown className="w-4 h-4 text-slate-300" /></div>}
          </div>
        );
      })}

      <div className="rounded-2xl bg-[#102B2A] p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#187B65] text-white flex items-center justify-center"><DollarSign className="w-5 h-5" /></span>
          <div>
            <p className="text-sm font-bold text-white">Commission earned</p>
            <p className="text-[11px] text-[#9fc7b8]">From completed GBP-attributed jobs in this period</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-[#54D9AE]">${(funnel.commission_total || 0).toFixed(2)}</p>
      </div>
    </div>
  );
}