import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radar, Loader2, Play, Info, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { provinceLabel } from '@/lib/communityShared';
import { CLASSIFICATIONS, serviceCategoryLabel } from '@/lib/discoveryShared';

export default function AdminDiscovery() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  const status = useQuery({
    queryKey: ['discoveryStatus'],
    queryFn: async () => (await base44.functions.invoke('demandDiscovery', { action: 'status' })).data,
  });

  const settings = status.data?.settings;
  const total = status.data?.total || 0;
  const byClassification = status.data?.by_classification || [];
  const byProvince = (status.data?.by_province || []).filter((r) => r.province_code);

  const maxCls = Math.max(1, ...byClassification.map((r) => r.count));
  const maxProv = Math.max(1, ...byProvince.map((r) => r.count));

  const toggle = async (field, value) => {
    if (!settings) return;
    setBusy(true);
    try {
      await base44.entities.PublicDiscoverySettings.update(settings.id, { [field]: value });
      queryClient.invalidateQueries({ queryKey: ['discoveryStatus'] });
    } finally {
      setBusy(false);
    }
  };

  const runNow = async () => {
    setBusy(true);
    setRunMsg('');
    try {
      const res = await base44.functions.invoke('demandDiscovery', { action: 'run' });
      const d = res.data || {};
      setRunMsg(d.skipped
        ? `Skipped: ${d.reason}`
        : `Run finished (${d.status}): ${d.opportunities_saved} new saved from ${d.posts_fetched} posts — ${d.duplicates_skipped} duplicates, ${d.irrelevant_filtered} filtered as irrelevant.`);
      queryClient.invalidateQueries({ queryKey: ['discoveryStatus'] });
    } catch (err) {
      setRunMsg(err?.response?.data?.error || 'Run failed.');
    } finally {
      setBusy(false);
    }
  };

  if (status.isPending) {
    return <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading discovery control center…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#102B2A] flex items-center gap-2"><Radar className="w-6 h-6 text-[#187B65]" /> National Discovery Control Center</h1>
        <p className="mt-1 text-sm text-slate-600">Authorized public sources, run health, verified discoveries and audit logs for the community's opportunity discovery engine.</p>
      </div>

      {/* Source controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A]">Authorized sources</h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">Only official public read endpoints are used. No logins are bypassed, no private or restricted content is accessed, and posts are stored as brief attributed excerpts with links.</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#f4f7f5] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-[#102B2A]">Reddit · public city-subreddit search</p>
              <p className="text-[11px] text-slate-500">Official read endpoint · 10 communities · brief excerpts + links only</p>
            </div>
            <Switch checked={!!settings?.reddit_enabled} onCheckedChange={(v) => toggle('reddit_enabled', v)} disabled={busy} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-red-800">Pause all discovery</p>
              <p className="text-[11px] text-red-600">Owner kill-switch — stops scheduled and manual runs.</p>
            </div>
            <Switch checked={!!settings?.paused} onCheckedChange={(v) => toggle('paused', v)} disabled={busy} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={runNow} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60">
            <Play className="w-4 h-4" /> Run discovery now
          </button>
          {settings?.last_run_at && <span className="text-xs text-slate-500">Last run: {new Date(settings.last_run_at).toLocaleString('en-CA')}</span>}
        </div>
        {runMsg && <p className="mt-3 rounded-xl bg-[#f4f7f5] border border-slate-100 px-4 py-2.5 text-xs font-semibold text-[#102B2A]">{runMsg}</p>}
      </div>

      {/* Verified discoveries */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Verified public discoveries</h2>
        <p className="mt-1 text-xs text-slate-500">Currently open opportunities stored from verified public posts: <span className="font-bold text-[#102B2A]">{total}</span></p>
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">By classification</p>
            {byClassification.length === 0 ? <p className="text-xs text-slate-500">No discoveries yet.</p> : (
              <div className="space-y-2">
                {byClassification.map((r) => (
                  <div key={r.classification}>
                    <div className="flex justify-between text-xs font-semibold text-[#102B2A]"><span>{(CLASSIFICATIONS.find((c) => c.id === r.classification) || {}).label || r.classification}</span><span>{r.count}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-[#187B65]" style={{ width: `${(r.count / maxCls) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">By province</p>
            {byProvince.length === 0 ? <p className="text-xs text-slate-500">No discoveries yet.</p> : (
              <div className="space-y-2">
                {byProvince.map((r) => (
                  <div key={r.province_code}>
                    <div className="flex justify-between text-xs font-semibold text-[#102B2A]"><span>{provinceLabel(r.province_code)}</span><span>{r.count}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-[#187B65]" style={{ width: `${(r.count / maxProv) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 flex items-start gap-1.5 text-[11px] text-slate-500"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> These counts are indexed public posts — not an estimate of total Canadians seeking services. Source coverage limits apply and are shown below.</p>
      </div>

      {/* Run history / audit log */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A]">Run history &amp; audit log</h2>
        {(status.data?.runs || []).length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No discovery runs yet. Use "Run discovery now" or the daily schedule.</p>
        ) : (
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3">Run</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Fetched</th><th className="py-2 pr-3">Dupes</th><th className="py-2 pr-3">Irrelevant</th><th className="py-2">Saved</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {status.data.runs.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-semibold text-[#102B2A]">{new Date(r.started_at || r.created_date).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-2 pr-3">{r.status}</td>
                  <td className="py-2 pr-3">{r.posts_fetched}</td>
                  <td className="py-2 pr-3">{r.duplicates_skipped}</td>
                  <td className="py-2 pr-3">{r.irrelevant_filtered}</td>
                  <td className="py-2 font-bold text-[#187B65]">{r.opportunities_saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {status.data?.runs?.some((r) => r.error) && (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-red-600"><ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Some runs reported source errors — see the run details in the database. Failed sources show as unavailable rather than producing fabricated results.</p>
        )}
      </div>
    </div>
  );
}