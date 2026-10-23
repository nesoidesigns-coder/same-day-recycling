import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
const tick = {fontSize:11,fill:'hsl(var(--market-muted))'};
const tip = {background:'hsl(var(--market-surface))',border:'1px solid hsl(var(--market-line))',borderRadius:12,color:'hsl(var(--market-ink))'};
export default function MarketHistory({ data }) {
  const history = data.history || [], seasonal = data.seasonality || [];
  const chart = (rows, season) => <div className="h-64 min-w-0"><ResponsiveContainer width="100%" height="100%">{season ? (
    <BarChart data={rows}><CartesianGrid stroke="hsl(var(--market-line))" vertical={false}/><XAxis dataKey="month" tick={tick}/><YAxis tick={tick} width={48}/><Tooltip contentStyle={tip} formatter={(v) => [Number(v).toLocaleString('en-CA'),'Mean estimated searches']}/><Bar dataKey="volume" fill="hsl(var(--market-accent))" radius={[4,4,0,0]} isAnimationActive={false}/></BarChart>
  ) : (
    <LineChart data={rows}><CartesianGrid stroke="hsl(var(--market-line))" vertical={false}/><XAxis dataKey="period" tick={tick} minTickGap={30}/><YAxis tick={tick} width={48}/><Tooltip contentStyle={tip} formatter={(v) => [Number(v).toLocaleString('en-CA'),'Estimated searches']}/><Line type="linear" dataKey="volume" stroke="hsl(var(--market-accent))" strokeWidth={2} dot={{r:3}} connectNulls={false} isAnimationActive={false}/></LineChart>
  )}</ResponsiveContainer></div>;
  return <div className="grid gap-4 lg:grid-cols-2">
    <section className="min-w-0 rounded-2xl border border-market-line bg-market-surface p-5"><h3 className="mb-4 font-bold">Historical search demand</h3>{history.some((r) => r.volume !== null) ? chart(history,false) : <p className="py-10 text-sm text-market-muted">Awaiting source-reported monthly estimates. Rolling averages are not plotted as individual months.</p>}<p className="mt-3 text-xs text-market-muted">{data.scope} · {data.overview.sources.join(' · ') || 'No source yet'} · estimated searches, not people. Missing months are gaps; coverage may vary.</p></section>
    <section className="min-w-0 rounded-2xl border border-market-line bg-market-surface p-5"><h3 className="mb-4 font-bold">Seasonal demand patterns</h3>{seasonal.length ? chart(seasonal,true) : <p className="py-10 text-sm text-market-muted">At least 12 months with the same keyword, source and geographic coverage are needed to show a defensible seasonal pattern.</p>}<p className="mt-3 text-xs text-market-muted">Mean of each calendar month's estimates across comparable years, never a sum of several years.</p></section>
  </div>;
}