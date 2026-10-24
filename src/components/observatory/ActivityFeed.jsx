import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ExternalLink, Activity } from 'lucide-react';
import { LAYER_META, fmtTime } from './useObservatory';

const MATCHING_META = {
  assigned: 'Assigned to a verified contractor',
  confirmed: 'Confirmed — in scheduling',
  converted: 'Converted to a booking',
  approved: 'Application approved',
  in_review: 'In review',
  awaiting: 'Awaiting contractor matching',
  'n/a': 'Not applicable',
};

const PROVINCE_LABELS = { BC: 'BC', AB: 'AB', SK: 'SK', MB: 'MB', ON: 'ON', QC: 'QC', NT: 'NT', NU: 'NU', YT: 'YT', NL: 'NL', PE: 'PE', NS: 'NS', NB: 'NB' };

const where = (e) => [e.city, PROVINCE_LABELS[e.province_code]].filter(Boolean).join(', ');

// Real-time activity stream. Internal platform events arrive anonymized
// (city, service level, timestamps). Public opportunities link to their
// original public source. Nothing here is generated to look busy.
export default function ActivityFeed({ data }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const events = (data?.feed || []).filter((e) => filter === 'all' || e.category === filter);
  const categories = [...new Set((data?.feed || []).map((e) => e.category))];

  if (!events.length) {
    return (
      <div className="rounded-3xl border border-market-line bg-market-surface p-6 text-center">
        <Activity className="mx-auto h-5 w-5 text-market-accent" />
        <p className="mt-2 text-sm font-bold text-market-ink">No activity recorded for this filter yet.</p>
        <p className="mt-1 text-xs text-market-muted">The stream only ever shows real events. It stays empty until verified activity arrives.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-market-ink">Live Market Activity Feed</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-market-line bg-market-bg px-3 py-2 text-xs text-market-ink"
          aria-label="Filter activity by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {events.map((e) => {
          const layer = LAYER_META[e.layer] || LAYER_META.recent;
          const open = expanded === e.id;
          return (
            <div key={e.id} className="rounded-2xl border border-market-line bg-market-bg">
              <button onClick={() => setExpanded(open ? null : e.id)} className="flex w-full flex-wrap items-center gap-2 px-3.5 py-3 text-left" aria-expanded={open}>
                {open ? <ChevronDown className="h-3.5 w-3.5 text-market-accent" /> : <ChevronRight className="h-3.5 w-3.5 text-market-muted" />}
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest ${layer.tone}`}>{layer.label}</span>
                <span className="text-xs font-bold text-market-ink">{e.category_label}</span>
                {where(e) && <span className="text-[11px] text-market-muted">· {where(e)}</span>}
                <span className="ml-auto text-[10px] text-market-muted">{fmtTime(e.event_at)}</span>
              </button>
              {open && (
                <div className="border-t border-market-line px-3.5 py-3 text-[11px] leading-relaxed text-market-muted">
                  <p><span className="font-bold text-market-ink">Source platform:</span> {e.source_platform}</p>
                  <p><span className="font-bold text-market-ink">Service requested:</span> {e.service}</p>
                  <p><span className="font-bold text-market-ink">Event timestamp:</span> {fmtTime(e.event_at)}</p>
                  <p><span className="font-bold text-market-ink">Last verified:</span> {fmtTime(e.verified_at)}</p>
                  <p><span className="font-bold text-market-ink">Opportunity status:</span> {String(e.status || '—').replace(/_/g, ' ')}</p>
                  <p><span className="font-bold text-market-ink">Contractor matching:</span> {MATCHING_META[e.matching] || e.matching}</p>
                  {e.classification && <p><span className="font-bold text-market-ink">Classification:</span> {e.classification.replace(/_/g, ' ')}</p>}
                  {e.title && <p className="mt-1 font-semibold text-market-ink">"{e.title}"</p>}
                  {e.link && (
                    <a href={e.link} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 font-bold text-[#54D9AE] hover:underline">
                      <ExternalLink className="h-3 w-3" /> View original public source
                    </a>
                  )}
                  {!e.link && <p className="mt-1.5">Internal platform event — personal details are never shown on the public observatory. <Link to="/contact" className="font-bold text-[#54D9AE] hover:underline">Contact us</Link> for service details.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-market-muted">{data?.privacy_note}</p>
    </div>
  );
}