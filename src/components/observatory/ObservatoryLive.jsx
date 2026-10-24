import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Radio, Loader2, AlertCircle } from 'lucide-react';
import useObservatory, { LAYER_META, fmtTime } from './useObservatory';
import ObservatoryCounters from './ObservatoryCounters';
import SourceStatusPanel from './SourceStatusPanel';
import ActivityFeed from './ActivityFeed';
import DemandMap from './DemandMap';
import RegionalRankings from './RegionalRankings';
import OpportunityPipeline from './OpportunityPipeline';
import AiInsights from './AiInsights';

// The live operational layer of the National Market Observatory: ticker,
// counters, source connections, real-time activity stream, demand map,
// rankings, admin pipeline and AI intelligence. Preserves the existing dark
// green design; the historical search dashboard above stays untouched.
export default function ObservatoryLive() {
  const query = useObservatory();
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    base44.auth.me().then((u) => setAdmin(u?.role === 'admin')).catch(() => setAdmin(false));
  }, []);

  const data = query.data;
  const latest = data?.feed?.[0];
  const latestText = latest
    ? `${latest.category_label}${latest.city ? ` in ${latest.city}` : ''} — ${fmtTime(latest.event_at)} (${latest.layer})`
    : 'No verified activity recorded yet.';

  return (
    <section aria-label="Live Observatory" className="mt-6 space-y-4">
      {/* Live ticker — the newest verified event, no artificial animation */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#187B65]/40 bg-[#0a2e25] px-4 py-3">
        <Radio className="h-4 w-4 flex-shrink-0 text-[#54D9AE]" />
        <span className="rounded-full bg-[#187B65] px-2 py-0.5 text-[9px] font-bold tracking-widest text-white">LIVE</span>
        <p className="min-w-0 flex-1 truncate text-xs font-bold text-market-ink">{query.isFetching ? 'Refreshing verified data…' : latestText}</p>
        <span className="hidden text-[10px] text-market-muted sm:inline">Auto-updates · last check {fmtTime(data?.generated_at)}</span>
      </div>

      {query.isPending && (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-market-line bg-market-surface py-14 text-sm text-market-muted">
          <Loader2 className="h-5 w-5 animate-spin" /> Connecting the Observatory to verified data sources…
        </div>
      )}
      {query.isError && (
        <div className="flex items-start gap-2 rounded-3xl border border-red-400/30 bg-red-400/10 px-4 py-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> The Observatory could not load its verified data right now. It will retry automatically — no placeholder data is shown.
        </div>
      )}

      {data && (
        <>
          {/* Data-layer legend */}
          <div className="flex flex-wrap gap-2">
            {['live', 'recent', 'historical', 'unavailable'].map((k) => (
              <span key={k} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest ${LAYER_META[k].tone}`}>
                {LAYER_META[k].label}
                <span className="font-medium normal-case tracking-normal opacity-80">
                  {k === 'live' && 'internal platform events'}
                  {k === 'recent' && 'scheduled external syncs'}
                  {k === 'historical' && 'periodic search datasets'}
                  {k === 'unavailable' && 'no verified source'}
                </span>
              </span>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3"><ObservatoryCounters data={data} /></div>
            <div className="lg:col-span-2"><SourceStatusPanel data={data} /></div>
          </div>

          <ActivityFeed data={data} />
          <DemandMap data={data} />
          <RegionalRankings data={data} />

          {admin && <OpportunityPipeline feedData={data} />}
          {admin && <AiInsights />}

          <p className="text-[11px] leading-relaxed text-market-muted">
            Methodology: internal events stream from Recycling OS records (anonymized on this public page). Public opportunities come from authorized API sources with deduplication and genuine-request classification; general discussions are never presented as customer leads. Historical datasets (Trends, Search Console) carry their own reporting periods. Paid integrations are not used without administrator approval.
          </p>
        </>
      )}
    </section>
  );
}