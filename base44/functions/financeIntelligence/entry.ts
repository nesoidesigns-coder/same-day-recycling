import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolveTenant } from '../../shared/financeTenant.ts';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function buildAggregates(txs) {
  const agg = {
    income_total: 0,
    expense_total: 0,
    tax_collected: { gst: 0, hst: 0, pst: 0, qst: 0 },
    tax_paid: { gst: 0, hst: 0, pst: 0, qst: 0 },
    expense_by_category: {},
    income_by_month: {},
    expense_by_month: {},
    outstanding_receivable: 0,
    needs_review_count: 0,
    missing_receipts: 0,
    refunded_or_disputed: 0,
  };
  for (const t of txs) {
    const amt = Number(t.amount) || 0;
    const month = (t.tx_date || '').slice(0, 7);
    const td = t.tax_detail || {};
    if (t.kind === 'income') {
      agg.income_total += amt;
      agg.income_by_month[month] = round2((agg.income_by_month[month] || 0) + amt);
      for (const k of ['gst', 'hst', 'pst', 'qst']) agg.tax_collected[k] += Number(td[k]) || 0;
      if (t.status === 'outstanding') agg.outstanding_receivable += amt;
    } else {
      agg.expense_total += amt;
      const c = t.category || 'other';
      agg.expense_by_category[c] = round2((agg.expense_by_category[c] || 0) + amt);
      agg.expense_by_month[month] = round2((agg.expense_by_month[month] || 0) + amt);
      for (const k of ['gst', 'hst', 'pst', 'qst']) agg.tax_paid[k] += Number(td[k]) || 0;
    }
    if (t.needs_review) agg.needs_review_count += 1;
    if (!t.receipt_uri) agg.missing_receipts += 1;
    if (t.status === 'refunded' || t.status === 'disputed') agg.refunded_or_disputed += 1;
  }
  for (const k of ['gst', 'hst', 'pst', 'qst']) {
    agg.tax_collected[k] = round2(agg.tax_collected[k]);
    agg.tax_paid[k] = round2(agg.tax_paid[k]);
  }
  agg.income_total = round2(agg.income_total);
  agg.expense_total = round2(agg.expense_total);
  return agg;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').slice(0, 500);

    const srole = base44.asServiceRole;
    const tenant = await resolveTenant(srole, user);

    // Load the tenant's own ledger (paginated, capped)
    let txs = [];
    let cursor = null;
    do {
      const page = await srole.entities.FinancialTx.filter(
        { owner_email: tenant.owner_email },
        { sort: '-tx_date', limit: 100, ...(cursor ? { cursor } : {}) }
      );
      txs = txs.concat(page.items || []);
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor && txs.length < 1000);

    const agg = buildAggregates(txs);
    const recent = txs.slice(0, 30).map((t) => ({
      kind: t.kind,
      date: t.tx_date,
      amount: t.amount,
      category: t.category,
      merchant: t.merchant,
      status: t.status,
      jurisdiction: t.tax_jurisdiction || '',
      needs_review: !!t.needs_review,
      missing_receipt: !t.receipt_uri,
    }));

    const llm = base44.asServiceRole.integrations.Core;
    if (question) {
      const res = await llm.InvokeLLM({
        prompt:
          `You are the AI financial analyst inside Recycling OS for "${tenant.business_name}". ` +
          `Answer the owner's question using ONLY the ledger figures provided below - never invent or estimate numbers. ` +
          `If the data cannot answer the question, say so plainly and suggest what to record. ` +
          `Tax figures are planning estimates only; never claim anything was filed with the CRA. ` +
          `Keep the answer to 2-5 short sentences, plain language, reference the real numbers.\n\n` +
          `BUSINESS: ${JSON.stringify(tenant)}\nTODAY: ${new Date().toISOString().slice(0, 10)}\n` +
          `LEDGER AGGREGATES: ${JSON.stringify(agg)}\n` +
          `RECENT TRANSACTIONS: ${JSON.stringify(recent)}\n\nQUESTION: ${question}`,
        response_json_schema: { type: 'object', properties: { answer: { type: 'string' } }, required: ['answer'] },
      });
      return Response.json({ answer: (res && res.answer) || '', tx_count: txs.length });
    }

    const res = await llm.InvokeLLM({
      prompt:
        `You are the AI financial analyst inside Recycling OS for "${tenant.business_name}", a junk removal / recycling business bookkeeping workspace. ` +
        `Analyze ONLY the ledger data provided below - never invent figures. Produce: ` +
        `1) a one-sentence headline summary of the financial position; ` +
        `2) 3-5 concrete insights (spending patterns, profit trends, outstanding invoices, data hygiene like missing receipts or flagged entries, tax collection vs paid) - each with title, detail (reference real numbers) and severity good/watch/action; ` +
        `3) a tax_note: one or two sentences on their estimated sales-tax position, phrased as planning estimates only, never as filed or due amounts. ` +
        `Plain language, no emoji.\n\n` +
        `BUSINESS: ${JSON.stringify(tenant)}\nTODAY: ${new Date().toISOString().slice(0, 10)}\n` +
        `LEDGER AGGREGATES: ${JSON.stringify(agg)}\n` +
        `RECENT TRANSACTIONS: ${JSON.stringify(recent)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, detail: { type: 'string' }, severity: { type: 'string', enum: ['good', 'watch', 'action'] } },
              required: ['title', 'detail', 'severity'],
            },
          },
          tax_note: { type: 'string' },
        },
        required: ['summary', 'insights'],
      },
    });
    return Response.json({ insights: res, tx_count: txs.length });
  } catch (error) {
    return Response.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}