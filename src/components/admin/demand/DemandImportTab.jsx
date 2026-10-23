import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";

// Import verified volume data (e.g. a Google Ads Keyword Planner export).
// Files are uploaded to private storage; every imported row is labeled with
// the source name the admin provides, so public figures keep their provenance.
export default function DemandImportTab({ onImported }) {
  const [file, setFile] = useState(null);
  const [sourceLabel, setSourceLabel] = useState("Google Ads Keyword Planner export");
  const [basis, setBasis] = useState("keyword_planner");
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!file) { setError("Choose a CSV or Excel file first."); return; }
    setWorking(true);
    setError("");
    setResult(null);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const res = await base44.functions.invoke("demandImport", { file_uri, source_label: sourceLabel, volume_basis: basis });
      setResult(res.data);
      if (onImported) onImported();
    } catch (e) {
      setError(e?.response?.data?.error || "Import failed. Check the file format and try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <h2 className="font-extrabold text-[#102B2A] text-lg mb-1">Import Volume Data</h2>
      <p className="text-sm text-slate-500 mb-5">
        Import a CSV or Excel export from Google Ads Keyword Planner (or another published source). The file is uploaded
        to private storage and every row is labeled with the source and date.
      </p>

      <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5 mb-5">
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#187B65] mb-2 flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Expected columns
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold">keyword</span> (required) · <span className="font-semibold">est_monthly_volume</span> (required) ·{" "}
          <span className="font-semibold">service_category</span> (junk_removal, furniture_removal, appliance_removal, electronics, recycling,
          waste_disposal, estate_cleanout, construction_debris, other) · <span className="font-semibold">province</span> ·{" "}
          <span className="font-semibold">city</span> · <span className="font-semibold">period</span> (YYYY-MM) ·{" "}
          <span className="font-semibold">trend_index</span> · <span className="font-semibold">trend_direction</span> (rising/steady/falling) ·{" "}
          <span className="font-semibold">competition</span> (low/medium/high).
          Merge overlapping keyword variants into one canonical keyword before exporting — duplicates are deduplicated
          automatically, but distinct overlapping variants would each count.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} placeholder="Source label" aria-label="Source label" />
        <Select value={basis} onValueChange={setBasis}>
          <SelectTrigger aria-label="Volume basis"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="keyword_planner">Google Keyword Planner estimate</SelectItem>
            <SelectItem value="published_estimate">Published industry estimate</SelectItem>
            <SelectItem value="admin_import">Admin-recorded estimate</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#187B65] file:px-4 file:py-2 file:text-white file:text-sm file:font-bold file:cursor-pointer"
          aria-label="Data file"
        />
      </div>

      <Button onClick={run} disabled={working} className="gap-2 bg-[#187B65] hover:bg-[#125C4E]">
        {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {working ? "Importing…" : "Import data"}
      </Button>

      {result && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#187B65]/5 border border-[#187B65]/20 px-4 py-3 text-sm text-[#102B2A]">
          <CheckCircle2 className="w-4 h-4 text-[#187B65] mt-0.5" />
          <span>Imported {result.created} observations (basis: {String(result.volume_basis).replace("_", " ")}).{result.skipped?.length ? ` Skipped: ${result.skipped.length}.` : ""} The public dashboards now include this data.</span>
        </div>
      )}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 mt-0.5" /> <span>{error}</span>
        </div>
      )}
    </div>
  );
}