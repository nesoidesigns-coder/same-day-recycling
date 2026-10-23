import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function MarketComparison({ data, onSelect }) {
  const rows = (data.categories || []).filter((r) => r.available).sort((a,b) => b.value-a.value);
  return <section className="min-w-0 rounded-2xl border border-market-line bg-market-surface p-5">
    <h3 className="font-bold">Service demand comparison</h3>
    <p className="mt-1 text-xs text-market-muted">{data.scope} · {data.engine} · {data.latest_period || 'No reporting period'} · same measure as the gauges. Select a bar to explore that service.</p>
    {!rows.length ? <p className="py-8 text-sm text-market-muted">Awaiting sourced service estimates; no sample volumes are displayed.</p> : <div className="mt-5" style={{height:Math.max(220,rows.length*42)}}><ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{left:0,right:16}}><XAxis type="number" tick={{fontSize:10,fill:'hsl(var(--market-muted))'}}/><YAxis type="category" dataKey="label" width={110} tick={{fontSize:10,fill:'hsl(var(--market-muted))'}}/><Tooltip cursor={false} formatter={(v) => [Number(v).toLocaleString('en-CA'),'Estimated searches']} contentStyle={{background:'hsl(var(--market-surface))',border:'1px solid hsl(var(--market-line))',color:'hsl(var(--market-ink))'}}/><Bar dataKey="value" fill="hsl(var(--market-accent))" radius={[0,5,5,0]} isAnimationActive={false} onClick={(r) => onSelect(r.category)} cursor="pointer"/></BarChart>
    </ResponsiveContainer></div>}
    <p className="mt-3 text-[11px] text-market-muted">Keyword coverage may differ by service; this is a comparison of recorded estimates, not a complete industry census.</p>
  </section>;
}