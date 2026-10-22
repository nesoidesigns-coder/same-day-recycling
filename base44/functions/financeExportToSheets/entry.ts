import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolveTenant } from '../../shared/financeTenant.ts';

const LEDGER_HEADERS = ['Date', 'Kind', 'Category', 'Merchant / Payer', 'Description', 'Subtotal', 'GST', 'HST', 'PST', 'QST', 'Total', 'Tax jurisdiction', 'Payment method', 'Status', 'Source', 'Job', 'Needs review'];
const SUMMARY_HEADERS = ['Category', 'Transactions', 'Subtotal', 'GST', 'HST', 'PST', 'QST', 'Total'];

function num(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to export your ledger.' }, { status: 401 });
    const tenant = await resolveTenant(base44.asServiceRole, user);

    // Load every transaction for this tenant (paginated)
    const txs = [];
    let cursor = undefined;
    for (let i = 0; i < 50; i++) {
      const page = await base44.entities.FinancialTx.filter(
        { owner_email: tenant.owner_email },
        { sort: '-tx_date', limit: 500, ...(cursor ? { cursor } : {}) }
      );
      txs.push(...page.items);
      if (!page.has_more || !page.next_cursor) break;
      cursor = page.next_cursor;
    }
    if (!txs.length) return Response.json({ error: 'No transactions to export yet.' }, { status: 400 });

    // Ledger rows
    const ledgerRows = [LEDGER_HEADERS];
    const byCategory = {};
    for (const t of txs) {
      const td = t.tax_detail || {};
      ledgerRows.push([
        t.tx_date || '',
        t.kind || '',
        t.category || '',
        t.merchant || '',
        t.description || '',
        num(t.subtotal_amount),
        num(td.gst), num(td.hst), num(td.pst), num(td.qst),
        num(t.amount),
        t.tax_jurisdiction || '',
        t.payment_method || '',
        t.status || '',
        t.source === 'platform_job' ? 'Platform job' : 'Independent',
        t.job_label || '',
        t.needs_review ? 'YES' : '',
      ]);
      if (t.kind === 'expense') {
        const c = byCategory[t.category || 'other'] || (byCategory[t.category || 'other'] = { count: 0, subtotal: 0, gst: 0, hst: 0, pst: 0, qst: 0, total: 0 });
        c.count++;
        c.subtotal += num(t.subtotal_amount);
        c.gst += num(td.gst); c.hst += num(td.hst); c.pst += num(td.pst); c.qst += num(td.qst);
        c.total += num(t.amount);
      }
    }

    const summaryRows = [SUMMARY_HEADERS];
    for (const [cat, c] of Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total)) {
      summaryRows.push([cat, c.count, num(c.subtotal), num(c.gst), num(c.hst), num(c.pst), num(c.qst), num(c.total)]);
    }
    const totalExpenses = Object.values(byCategory).reduce((s, c) => s + c.total, 0);
    summaryRows.push(['TOTAL EXPENSES', txs.filter((t) => t.kind === 'expense').length, '', '', '', '', '', num(totalExpenses)]);

    // Create the spreadsheet in the connected Google account
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const authHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const title = (tenant.business_name || 'Financial Ledger') + ' - ' + new Date().toISOString().slice(0, 10);
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: authHeaders,
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: 'Ledger' } }, { properties: { title: 'Expense Summary' } }],
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok) return Response.json({ error: created.error?.message || 'Google refused the new spreadsheet.' }, { status: 502 });
    const sheetId = created.spreadsheetId;

    // Fill both tabs
    const fills = await Promise.allSettled([
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Ledger!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ values: ledgerRows }),
      }),
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Expense Summary!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST', headers: authHeaders, signal: AbortSignal.timeout(20000),
        body: JSON.stringify({ values: summaryRows }),
      }),
    ]);
    const failed = fills.find((f) => f.status === 'fulfilled' && !f.value.ok);
    if (failed) {
      const errBody = await failed.value.json().catch(() => ({}));
      return Response.json({ error: 'Sheet created but the data did not fill: ' + (errBody.error?.message || 'unknown error') + '. Sheet: ' + created.spreadsheetUrl }, { status: 502 });
    }

    // Audit-log the export through the existing ingest action
    try {
      await base44.functions.invoke('financeIngest', { action: 'log_export', row_count: txs.length });
    } catch { /* non-critical */ }

    return Response.json({ sheet_url: created.spreadsheetUrl, title, tx_count: txs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}