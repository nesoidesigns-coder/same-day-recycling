import { MARKET_PROVIDERS, MARKET_MEASURES } from '@/lib/marketProviders';
const input = 'w-full min-w-0 rounded-xl border border-input bg-background p-2.5 text-sm text-foreground';

export default function MarketImportConfig({ metadata, onChange }) {
  const set = (key,value) => onChange({...metadata,[key]:value});
  return <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs text-muted-foreground">Original provider<select className={input} value={metadata.provider} onChange={(e) => onChange({...metadata,provider:e.target.value,source_label:MARKET_PROVIDERS.find((p) => p.id === e.target.value)?.label || '',source_url:MARKET_PROVIDERS.find((p) => p.id === e.target.value)?.url || ''})}>{MARKET_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
    <label className="text-xs text-muted-foreground">Source / dataset label<input className={input} value={metadata.source_label} onChange={(e) => set('source_label',e.target.value)}/></label>
    <label className="text-xs text-muted-foreground">Engine (file values override)<select className={input} value={metadata.search_engine} onChange={(e) => set('search_engine',e.target.value)}><option value="google">Google</option><option value="bing">Bing</option></select></label>
    <label className="text-xs text-muted-foreground">Measure (file values override)<select className={input} value={metadata.metric_type} onChange={(e) => set('metric_type',e.target.value)}>{MARKET_MEASURES.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    <label className="text-xs text-muted-foreground">Reporting month (required unless in file)<input className={input} type="month" value={metadata.period} onChange={(e) => set('period',e.target.value)}/></label>
    <label className="text-xs text-muted-foreground">Original source / report URL<input className={input} type="url" value={metadata.source_url} onChange={(e) => set('source_url',e.target.value)}/></label>
    <label className="text-xs text-muted-foreground">Average window start (if applicable)<input className={input} type="month" value={metadata.period_start} onChange={(e) => set('period_start',e.target.value)}/></label>
    <label className="text-xs text-muted-foreground">Average window end (if applicable)<input className={input} type="month" value={metadata.period_end} onChange={(e) => set('period_end',e.target.value)}/></label>
    <label className="text-xs text-muted-foreground">Provider's actual reporting cadence<input className={input} value={metadata.update_cadence} onChange={(e) => set('update_cadence',e.target.value)} placeholder="As documented in the source dataset"/></label>
    <label className="text-xs text-muted-foreground">Methodology / geographic and keyword coverage<textarea className={input} value={metadata.methodology_note} onChange={(e) => set('methodology_note',e.target.value)} placeholder="Describe the original dataset; do not infer clicks from volume"/></label>
  </div>;
}