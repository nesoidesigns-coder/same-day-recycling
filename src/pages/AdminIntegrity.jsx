import { useState } from 'react';
import IntegrationAuditReport from '@/components/admin/integrity/IntegrationAuditReport';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, PlayCircle, ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Info, Clock, ExternalLink } from 'lucide-react';

// Platform Integrity: the internal dashboard that verifies every public
// surface represents the same operational reality. Shows verified errors,
// affected pages, severity, run history and the coverage change log.

const CHECKS_ORDER = [
  'coverage_consistency',
  'pricing_consistency',
  'booking_availability',
  'contractor_status',
  'payment_integration_health',
  'review_verification',
  'page_rendering',
  'broken_links',
  'conflicting_claims',
  'meta_claim_drift',
  'quote_journey',
];

const SEV = {
  pass: { icon: CheckCircle2, tone: 'text-[#187B65]', chip: 'bg-[#187B65]/10 text-[#187B65]', label: 'Pass' },
  info: { icon: Info, tone: 'text-slate-500', chip: 'bg-slate-100 text-slate-600', label: 'Info' },
  warning: { icon: AlertTriangle, tone: 'text-amber-600', chip: 'bg-amber-100 text-amber-800', label: 'Warning' },
  error: { icon: XCircle, tone: 'text-red-600', chip: 'bg-red-100 text-red-700', label: 'Error' },
};

const CHECK_LABELS = {
  coverage_consistency: 'Coverage consistency',
  pricing_consistency: 'Pricing consistency',
  booking_availability: 'Booking availability',
  contractor_status: 'Contractor status',
  payment_integration_health: 'Payment integration health',
  review_verification: 'Review verification',
  page_rendering: 'Page rendering',
  broken_links: 'Broken links',
  conflicting_claims: 'Conflicting claims',
  meta_claim_drift: 'Meta claim drift',
  quote_journey: 'Quote → booking journey',
};

export default function AdminIntegrity() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  const status = useQuery({
    queryKey: ['platformIntegrity'],
    queryFn: async () => (await base44.functions.invoke('platformIntegrity', { action: 'latest' })).data,
  });

  const runNow = async (full = false) => {
    setRunning(true);
    setRunMsg('');
    try {
      const res = await base44.functions.invoke('platformIntegrity', full ? { action: 'full_audit' } : { action: 'run' });
      const d = res.data || {};
      const repairs = (d.repairs || []).length ? `, ${d.repairs.length} repair(s) applied/queued` : '';
      setRunMsg(`Check finished: ${d.status} — ${d.error_count} error(s), ${d.warning_count} warning(s), ${d.coverage_changes_logged} coverage change(s) logged${repairs}.`);
      queryClient.invalidateQueries({ queryKey: ['platformIntegrity'] });
    } catch (e) {
      setRunMsg(e?.response?.data?.error || 'Check failed — see runtime logs.');
    }
    setRunning(false);
  };

  const latest = status.data?.latest;
  const checks = latest?.checks || [];
  const ordered = [...CHECKS_ORDER.map((id) => checks.find((c) => c.check === id)).filter(Boolean), ...checks.filter((c) => !CHECKS_ORDER.includes(c.check))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#102B2A] flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-[#187B65]" /> Platform Integrity</h1>
        <p className="mt-1 text-sm text-slate-600">Automated verification that coverage, pricing, booking, contractor status, payments, reviews and page rendering all represent the same operational reality. Only verified findings are recorded — nothing is estimated.</p>
      </div>

      <IntegrationAuditReport />

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => runNow(false)} disabled={running} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60">
          <PlayCircle className="w-4 h-4" /> {running ? 'Running all checks…' : 'Run integrity check now'}
        </button>
        <button onClick={() => runNow(true)} disabled={running} className="inline-flex items-center gap-2 rounded-full border border-[#187B65] bg-white px-5 py-2.5 text-sm font-bold text-[#187B65] hover:bg-[#f4f7f5] transition-colors disabled:opacity-60">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Run full audit (claims + journey test)
        </button>
        <span className="text-xs text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />
          Last successful check: {status.data?.last_successful_check_at ? new Date(status.data.last_successful_check_at).toLocaleString('en-CA') : 'never'}
        </span>
        {runMsg && <span className="text-xs font-semibold text-[#102B2A]">{runMsg}</span>}
      </div>

      {status.isPending ? (
        <p className="flex items-center gap-2 py-6 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading integrity status…</p>
      ) : !latest ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-bold text-[#102B2A]">No integrity run has been executed yet.</p>
          <p className="mt-1 text-xs text-slate-500">Run the first check now — the daily schedule keeps it current afterwards.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-[#102B2A]">{checks.length}</div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Checks</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{latest.error_count}</div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Errors</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{latest.warning_count}</div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Warnings</p>
            </div>
          </div>

          {/* Check results */}
          <div className="space-y-3">
            {ordered.map((c) => {
              const meta = SEV[c.severity] || SEV.info;
              return (
                <div key={c.check + c.summary} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <meta.icon className={`w-4 h-4 ${meta.tone}`} />
                    <h3 className="text-sm font-bold text-[#102B2A]">{CHECK_LABELS[c.check] || c.check}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.chip}`}>{meta.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">{c.summary}</p>
                  {(c.details || []).length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-500 leading-relaxed">
                      {c.details.map((d, i) => <li key={i}>· {d}</li>)}
                    </ul>
                  )}
                  {(c.affected_pages || []).length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {c.affected_pages.map((p) => (
                        <a key={p} href={p} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65]">
                          {p || '/'} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Coverage change log */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-[#102B2A]">Coverage change log</h2>
            <p className="mt-1 text-xs text-slate-500">Every coverage change is recorded with timestamp, previous value, new value and the responsible actor. Contractor availability and matching activity are recorded as separate layers — matching activity never implies contractor availability.</p>
            {(status.data?.coverage_changes || []).length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No coverage changes observed yet.</p>
            ) : (
              <table className="mt-3 w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Recorded</th><th className="py-2 pr-3">City</th><th className="py-2 pr-3">Layer</th><th className="py-2 pr-3">Previous</th><th className="py-2 pr-3">New</th><th className="py-2">Actor</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {status.data.coverage_changes.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3">{new Date(c.created_date).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-2 pr-3 font-semibold text-[#102B2A]">{c.city}</td>
                      <td className="py-2 pr-3">{c.change_type.replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-3">{c.previous_value || '—'}</td>
                      <td className="py-2 pr-3 font-bold">{c.new_value || '—'}</td>
                      <td className="py-2">{c.changed_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Run history */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-[#102B2A]">Run history</h2>
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">Run</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Errors</th><th className="py-2">Warnings</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {(status.data?.runs || []).map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{new Date(r.created_date).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2 pr-3 font-bold">{r.status}</td>
                    <td className="py-2 pr-3 text-red-600">{r.error_count}</td>
                    <td className="py-2 text-amber-600">{r.warning_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}