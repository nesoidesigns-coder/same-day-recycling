import AuditReportBody from "@/components/admin/integrity/AuditReportBody";
import { Download, FileSearch } from "lucide-react";
import report from "@/components/admin/integrity/IntegrationAudit.md?raw";

export default function IntegrationAuditReport() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "Recycling-OS-Integration-Audit-2026-10-24.md";
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold"><FileSearch className="h-5 w-5 text-brand-emerald" /> National integration review</h2>
        <button onClick={download} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold"><Download className="h-4 w-4" /> Download report</button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Source-verified findings, completed repairs and outstanding verification. This is not a full-platform certification.</p>
      <details className="mt-4">
        <summary className="cursor-pointer py-2 text-sm font-bold text-brand-emerald">Read the audit and completion report</summary>
        <div className="mt-4 space-y-3 text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_pre]:overflow-x-auto">
          <AuditReportBody report={report} />
        </div>
      </details>
    </section>
  );
}