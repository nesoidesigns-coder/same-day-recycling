import { Loader2 } from 'lucide-react';
import MarketImportConfig from '@/components/demand/MarketImportConfig';
import MarketImportPreview from '@/components/demand/MarketImportPreview';
import useMarketImport from '@/hooks/useMarketImport';
import { downloadMarketTemplate } from '@/lib/marketCsv';

export default function DemandImportTab({ onImported }) {
  const form = useMarketImport(onImported);
  return <div className="text-foreground">
    <h2 className="text-lg font-extrabold">Import independent Canadian market data</h2>
    <p className="mb-4 mt-2 text-sm text-muted-foreground">DataForSEO, Semrush, Keyword Planner, Trends or other licensed datasets. No campaign or company ad account is needed for an export import. Use source-reported values only, not domain traffic or model-generated numbers.</p>
    <button onClick={downloadMarketTemplate} className="mb-4 text-sm font-bold underline">Download the blank CSV template</button>
    <p className="mb-4 text-xs leading-relaxed text-muted-foreground">One row per keyword, engine, measure, geography and reporting month. Required: keyword, a source value, country_code=CA, period and metric_type (or explicit defaults below). Use est_monthly_volume for search counts, estimated_clicks for licensed click estimates, trend_index plus comparison_group for Trends. Cities require a province. Leave missing values blank, never fill them with zero. Provider-grouped close_variants use | as their separator.</p>
    <MarketImportConfig metadata={form.metadata} onChange={form.setMetadata}/>
    <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={form.metadata.confirmed} onChange={(e) => form.setMetadata({...form.metadata,confirmed:e.target.checked})}/><span>I confirm this is licensed Canadian industry data for the selected engine and geography, and I will check values against the original source before publishing. Domain visits and campaign clicks are not market demand.</span></label>
    <label className="mt-4 block text-sm">Source file<input type="file" accept=".csv,.json,.xls,.xlsx" disabled={form.working} onChange={(e) => form.choose(e.target.files?.[0] || null)} className="mt-2 block max-w-full text-sm"/></label>
    <p className="mt-2 text-xs text-muted-foreground">CSV/JSON is read locally. Excel files are uploaded for review (stored privately). The public report contains approved aggregate observations, not your original file.</p>
    <button disabled={form.working || !form.file || !form.metadata.confirmed} onClick={() => form.run(false)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{form.working && <Loader2 className="h-4 w-4 animate-spin"/>}Validate and preview</button>
    <MarketImportPreview records={form.records}/>
    {form.records && <button disabled={form.working} onClick={() => form.run(true)} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">Confirm values and publish {form.records.length} observations</button>}
    {form.result && <p role="status" className="mt-4 text-sm">Published {form.result.created} new and updated {form.result.updated} existing observations. The observatory has refreshed.</p>}
    {form.error && <p role="alert" className="mt-4 text-sm text-destructive">{form.error}</p>}
  </div>;
}