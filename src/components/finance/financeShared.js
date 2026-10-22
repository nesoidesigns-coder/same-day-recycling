import { base44 } from "@/api/base44Client";

export const CATEGORIES = [
  { value: "job_income", label: "Job income" },
  { value: "other_income", label: "Other income" },
  { value: "fuel", label: "Fuel" },
  { value: "vehicle", label: "Vehicle & maintenance" },
  { value: "equipment", label: "Equipment" },
  { value: "disposal_fees", label: "Disposal & dump fees" },
  { value: "contractor_payment", label: "Contractor payments" },
  { value: "insurance", label: "Insurance" },
  { value: "office", label: "Office & supplies" },
  { value: "marketing", label: "Marketing" },
  { value: "professional_fees", label: "Professional fees" },
  { value: "other", label: "Other" },
];

export const categoryLabel = (v) => (CATEGORIES.find((c) => c.value === v) || {}).label || "Other";
export const fmtCAD = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export async function loadTenant() {
  const { data } = await base44.functions.invoke("financeIngest", { action: "tenant" });
  return data.tenant;
}

export async function loadTxs(ownerEmail) {
  const { items } = await base44.entities.FinancialTx.filter({ owner_email: ownerEmail }, { sort: "-tx_date", limit: 100 });
  return items || [];
}

export async function receiptUrl(fileUri) {
  if (!fileUri) return "";
  try {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
    return signed_url || "";
  } catch {
    return "";
  }
}

export function summarize(txs) {
  const live = (k) => txs.filter((t) => t.kind === k && t.status !== "refunded");
  const revenue = round2(live("income").reduce((s, t) => s + (Number(t.amount) || 0), 0));
  const expenses = round2(live("expense").reduce((s, t) => s + (Number(t.amount) || 0), 0));
  const taxes = round2(txs.reduce((s, t) => {
    const d = t.tax_detail || {};
    return s + (Number(d.gst) || 0) + (Number(d.hst) || 0) + (Number(d.pst) || 0) + (Number(d.qst) || 0);
  }, 0));
  const outstanding = round2(txs.filter((t) => t.status === "outstanding").reduce((s, t) => s + (Number(t.amount) || 0), 0));
  const withReceipt = txs.filter((t) => t.receipt_uri).length;
  const receiptRate = txs.length ? Math.round((withReceipt / txs.length) * 100) : 0;

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleString("en-CA", { month: "short" }) });
  }
  const series = months.map((m) => ({
    label: m.label,
    income: round2(txs.filter((t) => t.kind === "income" && String(t.tx_date || "").startsWith(m.key)).reduce((s, t) => s + (Number(t.amount) || 0), 0)),
    expense: round2(txs.filter((t) => t.kind === "expense" && String(t.tx_date || "").startsWith(m.key)).reduce((s, t) => s + (Number(t.amount) || 0), 0)),
  }));
  const active = series.filter((m) => m.income || m.expense);
  const projectedNet = active.length ? round2(active.reduce((s, m) => s + (m.income - m.expense), 0) / active.length) : 0;

  return {
    revenue, expenses, net: round2(revenue - expenses), taxes, outstanding,
    receiptRate, series, projectedNet,
    needsReview: txs.filter((t) => t.needs_review).length,
  };
}

export function exportCsv(txs) {
  const header = ["Date", "Kind", "Category", "Merchant", "Description", "Amount", "Subtotal", "GST", "HST", "PST", "QST", "Jurisdiction", "Payment method", "Status", "Source", "Receipt attached"];
  const rows = txs.map((t) => {
    const d = t.tax_detail || {};
    return [
      t.tx_date, t.kind, categoryLabel(t.category), t.merchant, (t.description || "").replace(/"/g, "'"),
      (Number(t.amount) || 0).toFixed(2), (Number(t.subtotal_amount) || 0).toFixed(2),
      (Number(d.gst) || 0).toFixed(2), (Number(d.hst) || 0).toFixed(2), (Number(d.pst) || 0).toFixed(2), (Number(d.qst) || 0).toFixed(2),
      t.tax_jurisdiction, t.payment_method, t.status, t.source === "platform_job" ? "SDR job" : "Independent", t.receipt_uri ? "yes" : "no",
    ].map((v) => '"' + String(v) + '"').join(",");
  });
  return [header.join(","), ...rows].join("\n");
}