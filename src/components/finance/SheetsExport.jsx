import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileSpreadsheet, Loader2, ExternalLink, AlertTriangle } from "lucide-react";

export default function SheetsExport() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { sheet_url, tx_count } | { error }
  const [link, setLink] = useState(null);

  const exportSheet = async () => {
    setBusy(true); setResult(null); setLink(null);
    try {
      const { data } = await base44.functions.invoke("financeExportToSheets", {});
      setResult({ sheet_url: data.sheet_url, tx_count: data.tx_count });
      setLink(data.sheet_url);
    } catch (err) {
      setResult({ error: err?.response?.data?.error || err.message || "Could not export to Google Sheets." });
    }
    setBusy(false);
  };

  return (
    <div>
      <button onClick={exportSheet} disabled={busy} className="flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-2 text-xs font-bold text-[#54D9AE] hover:bg-[#187B65]/20 transition-colors disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
        {busy ? "Creating your Google Sheet…" : "Export to Google Sheet"}
      </button>
      {result?.error && (
        <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="break-words">{result.error}</span>
        </div>
      )}
      {result?.sheet_url && (
        <div className="mt-2 rounded-xl border border-[#187B65]/40 bg-[#187B65]/10 px-3 py-2 text-xs text-white">
          <p className="font-bold text-[#54D9AE]">{result.tx_count} transaction{result.tx_count === 1 ? "" : "s"} exported to a new Google Sheet.</p>
          <a href={result.sheet_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-bold text-white underline">
            Open it in Google Sheets <ExternalLink className="w-3 h-3" />
          </a>
          <p className="mt-1 text-white/50">Share the sheet link with your accountant. It has a Ledger tab and an Expense Summary tab.</p>
        </div>
      )}
    </div>
  );
}