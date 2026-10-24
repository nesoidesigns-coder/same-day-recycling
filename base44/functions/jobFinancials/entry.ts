import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { taxFor, provinceForCity } from '../../shared/canadaTax.ts';

// Job Financials: the per-job financial ledger behind Revenue Intelligence &
// Operator Profitability. One record per completed booking, synced from REAL
// records (Booking, ChangeOrder, PaypalTransaction, TrackingEvent) — never a
// duplicate of the booking or payment itself. Taxes are recorded separately
// and never counted as revenue. Commission is charged only on eligible jobs:
// platform-generated jobs default to 25%, contractor-owned jobs carry 0% unless
// their fee-terms agreement states a percentage.

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (n) => Number(n) || 0;
const items = (p) => (Array.isArray(p) ? p : p?.items) || [];

const EXPENSE_KINDS = ['disposal', 'labour', 'fuel', 'other'];
const RECEIPT_KINDS = ['disposal', 'weighbridge', 'labour', 'fuel', 'other'];
const RECEIPT_COVERS = { disposal: ['disposal', 'weighbridge'], labour: ['labour'], fuel: ['fuel'], other: ['other'] };
const STAGE_LABELS = {
  initial_quote: "During Rex's initial quotation",
  after_quote: 'After the original quote',
  arrival: 'During contractor arrival',
  loading: 'During loading',
  before_completion: 'Before final completion',
  none: 'No additions',
};
const LOAD_EVENT_ORDER = ['contractor_assigned', 'contractor_en_route', 'contractor_arrived', 'pickup_in_progress', 'materials_loaded', 'job_completed'];

function parseQuote(s) {
  const m = String(s || '').match(/\$?\s*([\d,]+(?:\.\d+)?)/);
  return m ? Number(m[1].replace(/,/g, '')) : 0;
}

// Which job stage a customer addition happened at, derived from the job's real
// lifecycle timeline (TrackingEvent) and the original approval date.
function stageForAddition(co, booking, events) {
  const t = new Date(co.created_date).getTime();
  const approval = booking.approval_date ? new Date(`${booking.approval_date}T23:59:59Z`).getTime() : 0;
  if (approval && t <= approval) return 'initial_quote';
  let latest = null;
  for (const ev of events) {
    const et = ev.occurred_at ? new Date(ev.occurred_at).getTime() : 0;
    if (et && et <= t) {
      const idx = LOAD_EVENT_ORDER.indexOf(ev.stage);
      if (idx >= 0 && (!latest || idx > latest.idx)) latest = { idx, stage: ev.stage };
    }
  }
  if (latest) {
    if (latest.stage === 'job_completed') return 'before_completion';
    if (['pickup_in_progress', 'materials_loaded'].includes(latest.stage)) return 'loading';
    if (['contractor_arrived', 'contractor_en_route'].includes(latest.stage)) return 'arrival';
  }
  return 'after_quote';
}

// Commission rules: agreement fee terms first, then source. Contractor-owned
// jobs are never auto-charged a commission unless their agreement requires one.
function commissionFor(b) {
  const rule = String(b.fee_terms_snapshot?.rule || '');
  const src = b.job_source || 'platform_generated';
  if (rule.startsWith('percentage_')) return { rate: num(rule.split('_')[1]), basis: 'agreement_terms' };
  if (src === 'contractor_generated') return { rate: 0, basis: 'contractor_owned' };
  const recorded = num(b.commission_rate);
  return { rate: recorded > 0 ? recorded : 25, basis: 'platform_generated' };
}

function recompute(rec) {
  const eligible = num(rec.final_customer_price);
  const commission = r2((eligible * num(rec.commission_rate)) / 100);
  const payout = r2(eligible - commission - num(rec.refund_amount));
  const contractorExpenses = num(rec.expenses_disposal) + num(rec.expenses_labour) + num(rec.expenses_fuel) + num(rec.expenses_other);
  const contractorProfit = r2(payout - contractorExpenses);
  const platformProfit = r2(commission - num(rec.processing_fees) - num(rec.expenses_platform));
  return {
    commission_earned: commission,
    contractor_payout: payout,
    contractor_profit: contractorProfit,
    platform_profit: platformProfit,
    contribution_margin_pct: eligible > 0 ? Math.round((contractorProfit / eligible) * 1000) / 10 : 0,
  };
}

function loadBand(rec) {
  const e = num(rec.load_eighths_final);
  if (e > 0) return e >= 8 ? 'full truck' : e === 1 ? 'minimum' : `${e}/8 truck`;
  const p = num(rec.final_customer_price);
  if (!p) return 'unknown';
  if (p < 200) return 'minimum (est. from price)';
  if (p < 400) return '1/8 truck (est.)';
  if (p < 700) return '1/4 truck (est.)';
  if (p < 1400) return '1/2 truck (est.)';
  if (p < 2100) return '3/4 truck (est.)';
  return 'full truck (est.)';
}

async function syncBooking(base44, bookingId) {
  const b = await base44.asServiceRole.entities.Booking.get(bookingId);
  if (!b || b.record_type === 'internal_test' || b.status === 'cancelled') return { skipped: true };
  const existing = items(await base44.asServiceRole.entities.JobFinancials.filter({ booking_id: bookingId }, { limit: 1 }))[0];

  const [changeOrders, events, ppTx] = await Promise.all([
    base44.asServiceRole.entities.ChangeOrder.filter({ booking_id: bookingId }, { sort: 'created_date', limit: 100 }),
    base44.asServiceRole.entities.TrackingEvent.filter({ booking_id: bookingId }, { limit: 200 }),
    base44.asServiceRole.entities.PaypalTransaction.filter({ ref_id: bookingId, status: 'paid' }, { limit: 5 }),
  ]);
  const cosRows = items(changeOrders);
  const eventRows = items(events);
  const ppRows = items(ppTx);

  const approvedCos = cosRows.filter((c) => c.status === 'approved');
  const additionalItems = approvedCos.map((c) => ({
    number: num(c.number),
    items: String(c.items || '').slice(0, 200),
    amount: num(c.amount_delta),
    stage: stageForAddition(c, b, eventRows),
    status: c.status,
    created_date: c.created_date,
  }));
  const additionalRevenue = r2(approvedCos.reduce((s, c) => s + num(c.amount_delta), 0));
  const upsellStage = additionalItems.length ? additionalItems[0].stage : 'none';

  const approvedPrice = num(b.approved_quote_amount) || num(b.final_invoice) || num(b.job_value);
  const originalQuote = parseQuote(b.quote_estimate) || num(b.job_value) || approvedPrice;
  const finalPrice = r2(Math.max(0, approvedPrice + additionalRevenue));
  const commission = commissionFor(b);
  const province = b.province_code || provinceForCity(b.city);
  const tax = taxFor(province, finalPrice);
  // Payment processing fees on platform-collected payments (PayPal standard
  // rate, clearly an estimate until the owner reconciles).
  const processingFees = b.payment_status === 'paid' && ppRows.length
    ? r2(Math.max(...ppRows.map((t) => num(t.amount))) * 0.029 + 0.3)
    : 0;

  const existingReceipts = existing?.expense_receipts || [];
  const missingKinds = EXPENSE_KINDS.filter((k) =>
    num(existing?.[`expenses_${k}`]) === 0 &&
    !existingReceipts.some((r) => (RECEIPT_COVERS[k] || [k]).includes(r.kind))
  );

  const rec = {
    booking_id: bookingId,
    reference_code: b.reference_code || existing?.reference_code || '',
    job_name: b.name || existing?.job_name || '',
    city: b.city || existing?.city || '',
    province_code: province || existing?.province_code || '',
    service_category: existing?.service_category || '',
    partner_id: b.partner_id || existing?.partner_id || '',
    partner_name: b.partner_name || existing?.partner_name || '',
    job_source: b.job_source || existing?.job_source || 'platform_generated',
    original_quote: r2(originalQuote),
    approved_price: r2(approvedPrice),
    additional_revenue: additionalRevenue,
    final_customer_price: finalPrice,
    additional_items: additionalItems,
    upsell_stage: upsellStage,
    load_original: existing?.load_original || '',
    load_final: existing?.load_final || '',
    load_eighths_original: num(existing?.load_eighths_original),
    load_eighths_final: num(existing?.load_eighths_final),
    commission_rate: commission.rate,
    commission_basis: commission.basis,
    refund_amount: num(b.refund_amount),
    tax_label: `${tax.label}${tax.estimated ? ' (estimated)' : ''}`,
    taxes_collected: tax.tax,
    expenses_disposal: num(existing?.expenses_disposal),
    expenses_labour: num(existing?.expenses_labour),
    expenses_fuel: num(existing?.expenses_fuel),
    expenses_other: num(existing?.expenses_other),
    expenses_platform: num(existing?.expenses_platform),
    processing_fees: processingFees,
    expense_receipts: existingReceipts,
    payment_method: b.payment_status === 'paid' ? 'platform' : b.payment_status === 'paid_externally' ? 'external' : 'none',
    payment_verified: b.payment_status === 'paid' ? true : Boolean(b.external_payment_verified),
    job_status: b.status || existing?.job_status || '',
    expenses_verified: Boolean(existing?.expenses_verified),
    missing_expense_kinds: missingKinds,
    last_synced_at: new Date().toISOString(),
  };
  Object.assign(rec, recompute(rec));
  rec.audit = [
    ...(existing?.audit || []),
    { date: new Date().toISOString(), event: 'synced', note: `final $${finalPrice} · commission ${commission.rate}% = $${rec.commission_earned} · payout $${rec.contractor_payout} · additions $${additionalRevenue}` },
  ].slice(-15);

  if (existing) await base44.asServiceRole.entities.JobFinancials.update(existing.id, rec);
  else await base44.asServiceRole.entities.JobFinancials.create(rec);
  return { synced: true, booking_id: bookingId, final_customer_price: finalPrice, commission_earned: rec.commission_earned };
}

async function syncAll(base44) {
  let cursor;
  let synced = 0;
  let skipped = 0;
  for (let i = 0; i < 6; i++) {
    const page = await base44.asServiceRole.entities.Booking.filter(
      { record_type: { $ne: 'internal_test' }, status: 'completed' },
      cursor ? { sort: '-created_date', limit: 500, cursor } : { sort: '-created_date', limit: 500 }
    );
    for (const b of items(page)) {
      const res = await syncBooking(base44, b.id);
      if (res?.synced) synced += 1;
      else skipped += 1;
    }
    cursor = page?.next_cursor;
    if (!page?.has_more || !cursor) break;
  }
  return { synced, skipped };
}

async function loadFinancials(base44) {
  const rows = [];
  let cursor;
  for (let i = 0; i < 6; i++) {
    const page = await base44.asServiceRole.entities.JobFinancials.filter(
      {},
      cursor ? { sort: '-last_synced_at', limit: 500, cursor } : { sort: '-last_synced_at', limit: 500 }
    );
    rows.push(...items(page));
    cursor = page?.next_cursor;
    if (!page?.has_more || !cursor) break;
  }
  return rows;
}

function buildNetwork(rows, disputes) {
  rows = rows.filter((r) => r.job_status === 'completed' || (!r.job_status && r.final_customer_price > 0));
  const withAdditions = rows.filter((r) => num(r.additional_revenue) !== 0);
  const gross = r2(rows.reduce((s, r) => s + num(r.final_customer_price), 0));
  const commissionTotal = r2(rows.reduce((s, r) => s + num(r.commission_earned), 0));
  const payoutTotal = r2(rows.reduce((s, r) => s + num(r.contractor_payout), 0));
  const contractorProfitTotal = r2(rows.reduce((s, r) => s + num(r.contractor_profit), 0));
  const platformProfitTotal = r2(rows.reduce((s, r) => s + num(r.platform_profit), 0));
  const expensesTotal = r2(rows.reduce((s, r) => s + num(r.expenses_disposal) + num(r.expenses_labour) + num(r.expenses_fuel) + num(r.expenses_other), 0));

  const group = (pick) => {
    const out = {};
    for (const r of rows) {
      const k = pick(r) || 'Unknown';
      const g = (out[k] = out[k] || { key: k, jobs: 0, gross: 0, payout: 0, commission: 0, expenses: 0, contribution: 0, additional: 0 });
      g.jobs += 1;
      g.gross += num(r.final_customer_price);
      g.payout += num(r.contractor_payout);
      g.commission += num(r.commission_earned);
      g.expenses += num(r.expenses_disposal) + num(r.expenses_labour) + num(r.expenses_fuel) + num(r.expenses_other);
      g.contribution += num(r.contractor_profit);
      g.additional += num(r.additional_revenue);
    }
    return Object.values(out)
      .map((g) => ({
        ...g,
        gross: r2(g.gross), payout: r2(g.payout), commission: r2(g.commission),
        expenses: r2(g.expenses), contribution: r2(g.contribution), additional: r2(g.additional),
        avg_job: g.jobs ? r2(g.gross / g.jobs) : 0,
        margin_pct: g.gross > 0 ? Math.round((g.contribution / g.gross) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.contribution - a.contribution);
  };

  const byStage = {};
  for (const r of withAdditions) for (const it of r.additional_items || []) {
    const g = (byStage[it.stage] = byStage[it.stage] || { stage: it.stage, label: STAGE_LABELS[it.stage] || it.stage, count: 0, revenue: 0 });
    g.count += 1;
    g.revenue += num(it.amount);
  }

  const additionBookingIds = new Set(withAdditions.map((r) => r.booking_id));
  const priceChangeDisputes = disputes.filter((d) => additionBookingIds.has(d.booking_id));

  return {
    overview: {
      jobs: rows.length,
      gross_sales: gross,
      platform_commission: commissionTotal,
      contractor_payouts: payoutTotal,
      avg_expenses: rows.length ? r2(expensesTotal / rows.length) : 0,
      avg_contribution: rows.length ? r2(contractorProfitTotal / rows.length) : 0,
      contractor_profit_total: contractorProfitTotal,
      platform_profit_total: platformProfitTotal,
      contribution_margin_pct: gross > 0 ? Math.round((contractorProfitTotal / gross) * 1000) / 10 : 0,
      platform_margin_pct: gross > 0 ? Math.round((platformProfitTotal / gross) * 1000) / 10 : 0,
      verified_jobs: rows.filter((r) => r.expenses_verified).length,
    },
    upsell: {
      bookings_with_additions: withAdditions.length,
      pct_with_additions: rows.length ? Math.round((withAdditions.length / rows.length) * 100) : 0,
      additional_revenue: r2(rows.reduce((s, r) => s + num(r.additional_revenue), 0)),
      avg_additional_per_booking: rows.length ? r2(rows.reduce((s, r) => s + num(r.additional_revenue), 0) / rows.length) : 0,
      avg_additional_when_added: withAdditions.length ? r2(withAdditions.reduce((s, r) => s + num(r.additional_revenue), 0) / withAdditions.length) : 0,
      avg_original_quote: rows.length ? r2(rows.reduce((s, r) => s + num(r.original_quote), 0) / rows.length) : 0,
      avg_final_price: rows.length ? r2(gross / rows.length) : 0,
      incremental_contractor_profit: r2(withAdditions.reduce((s, r) => s + num(r.additional_revenue) * (1 - num(r.commission_rate) / 100), 0)),
      incremental_platform_profit: r2(withAdditions.reduce((s, r) => s + num(r.additional_revenue) * (num(r.commission_rate) / 100), 0)),
      by_stage: Object.values(byStage).map((g) => ({ ...g, revenue: r2(g.revenue) })).sort((a, b) => b.revenue - a.revenue),
      disputes_with_price_changes: { count: priceChangeDisputes.length, sample: priceChangeDisputes.slice(0, 5).map((d) => d.complaint?.slice(0, 120) || d.job_ref || 'dispute') },
    },
    by_city: group((r) => r.city),
    by_contractor: group((r) => r.partner_name || 'Unassigned'),
    by_load: group((r) => loadBand(r)),
  };
}

async function owningPartner(base44, user, rec) {
  if (!user?.email || !rec?.partner_id) return null;
  const partner = items(await base44.asServiceRole.entities.Partner.filter({ email: user.email }, { limit: 1 }))[0];
  return partner && partner.id === rec.partner_id ? partner : null;
}

function trimmedJob(r) {
  return {
    booking_id: r.booking_id, reference_code: r.reference_code, job_name: r.job_name,
    city: r.city, partner_name: r.partner_name, job_source: r.job_source,
    original_quote: r.original_quote, approved_price: r.approved_price,
    additional_revenue: r.additional_revenue, final_customer_price: r.final_customer_price,
    upsell_stage: r.upsell_stage, commission_rate: r.commission_rate, commission_basis: r.commission_basis,
    commission_earned: r.commission_earned, contractor_payout: r.contractor_payout,
    expenses_disposal: r.expenses_disposal, expenses_labour: r.expenses_labour,
    expenses_fuel: r.expenses_fuel, expenses_other: r.expenses_other, processing_fees: r.processing_fees,
    tax_label: r.tax_label, taxes_collected: r.taxes_collected,
    contractor_profit: r.contractor_profit, platform_profit: r.platform_profit,
    contribution_margin_pct: r.contribution_margin_pct, payment_method: r.payment_method,
    payment_verified: r.payment_verified, expenses_verified: r.expenses_verified,
    missing_expense_kinds: r.missing_expense_kinds, last_synced_at: r.last_synced_at,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.role === 'admin';

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'network';

    if (action === 'network') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const [rows, disputes] = await Promise.all([
        loadFinancials(base44),
        base44.asServiceRole.entities.Dispute.filter({}, { sort: '-created_date', limit: 200 }).then((p) => items(p)),
      ]);
      const net = buildNetwork(rows, disputes);
      return Response.json({
        generated_at: new Date().toISOString(),
        ...net,
        jobs: rows.map(trimmedJob),
        missing_records: {
          count: rows.filter((r) => !r.expenses_verified).length,
          sample: rows.filter((r) => !r.expenses_verified).slice(0, 8).map((r) => ({
            reference_code: r.reference_code, job_name: r.job_name, partner_name: r.partner_name,
            missing: r.missing_expense_kinds, payout: r.contractor_payout,
          })),
        },
        stage_labels: STAGE_LABELS,
      });
    }

    if (action === 'detail') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const rec = items(await base44.asServiceRole.entities.JobFinancials.filter({ booking_id: body.booking_id }, { limit: 1 }))[0];
      if (!rec) return Response.json({ error: 'No financial record — sync this job first.' }, { status: 404 });
      const [cos, booking] = await Promise.all([
        base44.asServiceRole.entities.ChangeOrder.filter({ booking_id: body.booking_id }, { sort: 'created_date', limit: 50 }),
        base44.asServiceRole.entities.Booking.get(body.booking_id),
      ]);
      return Response.json({
        financial: rec,
        change_orders: cos.map((c) => ({ id: c.id, number: c.number, items: c.items, amount_delta: c.amount_delta, status: c.status, approval_method: c.approval_method, created_date: c.created_date, responded_date: c.responded_date })),
        booking: booking ? { id: booking.id, name: booking.name, city: booking.city, status: booking.status, payment_status: booking.payment_status, approval_method: booking.approval_method, approval_date: booking.approval_date, approved_quote_amount: booking.approved_quote_amount, quote_estimate: booking.quote_estimate, job_source: booking.job_source, commission_rate: booking.commission_rate, partner_name: booking.partner_name } : null,
      });
    }

    if (action === 'sync') {
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });
      if (body.booking_id) return Response.json(await syncBooking(base44, body.booking_id));
      return Response.json(await syncAll(base44));
    }

    if (action === 'save_expenses') {
      const rec = items(await base44.asServiceRole.entities.JobFinancials.filter({ booking_id: body.booking_id }, { limit: 1 }))[0];
      if (!rec) return Response.json({ error: 'No financial record for this booking yet.' }, { status: 404 });
      const partner = isAdmin ? null : await owningPartner(base44, user, rec);
      if (!isAdmin && !partner) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const e = body.expenses || {};
      const upd = {};
      for (const k of EXPENSE_KINDS) if (e[k] !== undefined) upd[`expenses_${k}`] = Math.max(0, num(e[k]));
      if (e.platform !== undefined) upd.expenses_platform = Math.max(0, num(e.platform));
      const next = { ...rec, ...upd };
      Object.assign(upd, recompute(next));
      upd.expenses_verified = true;
      upd.missing_expense_kinds = EXPENSE_KINDS.filter((k) => num(upd[`expenses_${k}`] ?? rec[`expenses_${k}`]) === 0 && !(rec.expense_receipts || []).some((r) => (RECEIPT_COVERS[k] || [k]).includes(r.kind)));
      upd.audit = [...(rec.audit || []), { date: new Date().toISOString(), event: 'expenses_recorded', note: `${isAdmin ? 'Admin' : partner.name} entered expenses: disposal $${num(upd.expenses_disposal || rec.expenses_disposal)}, labour $${num(upd.expenses_labour || rec.expenses_labour)}, fuel $${num(upd.expenses_fuel || rec.expenses_fuel)}, other $${num(upd.expenses_other || rec.expenses_other)}` }].slice(-15);
      const updated = await base44.asServiceRole.entities.JobFinancials.update(rec.id, upd);
      return Response.json({ financial: updated });
    }

    if (action === 'receipts_add') {
      const rec = items(await base44.asServiceRole.entities.JobFinancials.filter({ booking_id: body.booking_id }, { limit: 1 }))[0];
      if (!rec) return Response.json({ error: 'No financial record for this booking yet.' }, { status: 404 });
      const partner = isAdmin ? null : await owningPartner(base44, user, rec);
      if (!isAdmin && !partner) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const kind = RECEIPT_KINDS.includes(body.kind) ? body.kind : 'other';
      const receipt = {
        id: crypto.randomUUID(),
        kind,
        label: String(body.label || kind).slice(0, 120),
        amount: Math.max(0, num(body.amount)),
        file_uri: String(body.file_uri || '').slice(0, 500),
        added_date: new Date().toISOString(),
        added_by: isAdmin ? user.email : partner.name,
      };
      const upd = { expense_receipts: [...(rec.expense_receipts || []), receipt] };
      // A receipt with an amount on a still-empty expense category records that expense.
      const covered = kind === 'weighbridge' ? 'disposal' : kind;
      if (receipt.amount > 0 && EXPENSE_KINDS.includes(covered) && num(rec[`expenses_${covered}`]) === 0) {
        upd[`expenses_${covered}`] = receipt.amount;
      }
      const next = { ...rec, ...upd, expense_receipts: upd.expense_receipts };
      Object.assign(upd, recompute(next));
      upd.missing_expense_kinds = EXPENSE_KINDS.filter((k) => num(upd[`expenses_${k}`] ?? rec[`expenses_${k}`]) === 0 && !upd.expense_receipts.some((r) => (RECEIPT_COVERS[k] || [k]).includes(r.kind)));
      upd.audit = [...(rec.audit || []), { date: receipt.added_date, event: 'receipt_attached', note: `${receipt.kind}: ${receipt.label} $${receipt.amount}` }].slice(-15);
      const updated = await base44.asServiceRole.entities.JobFinancials.update(rec.id, upd);
      return Response.json({ financial: updated });
    }

    if (action === 'receipts_remove') {
      const rec = items(await base44.asServiceRole.entities.JobFinancials.filter({ booking_id: body.booking_id }, { limit: 1 }))[0];
      if (!rec) return Response.json({ error: 'No financial record for this booking yet.' }, { status: 404 });
      const partner = isAdmin ? null : await owningPartner(base44, user, rec);
      if (!isAdmin && !partner) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const upd = { expense_receipts: (rec.expense_receipts || []).filter((r) => r.id !== body.receipt_id) };
      upd.audit = [...(rec.audit || []), { date: new Date().toISOString(), event: 'receipt_removed', note: `receipt ${body.receipt_id} removed by ${isAdmin ? 'admin' : partner.name}` }].slice(-15);
      const updated = await base44.asServiceRole.entities.JobFinancials.update(rec.id, upd);
      return Response.json({ financial: updated });
    }

    if (action === 'partner_data') {
      const partner = items(await base44.asServiceRole.entities.Partner.filter({ email: user.email }, { limit: 1 }))[0];
      if (!partner) return Response.json({ error: 'No partner account linked to this login.' }, { status: 403 });
      const jobs = items(await base44.asServiceRole.entities.Booking.filter(
        { partner_id: partner.id, assignment_status: { $in: ['completed', 'paid'] } },
        { sort: '-created_date', limit: 200 }
      ));
      const ids = jobs.map((j) => j.id);
      const financials = ids.length
        ? items(await base44.asServiceRole.entities.JobFinancials.filter({ booking_id: { $in: ids } }, { limit: 200 }))
        : [];
      const finByBooking = Object.fromEntries(financials.map((f) => [f.booking_id, f]));
      const fin = jobs.map((j) => finByBooking[j.id]).filter(Boolean);
      const summary = {
        completed_jobs: fin.length,
        payout_earned: r2(fin.reduce((s, f) => s + num(f.contractor_payout), 0)),
        contribution_earned: r2(fin.reduce((s, f) => s + num(f.contractor_profit), 0)),
        avg_contribution: fin.length ? r2(fin.reduce((s, f) => s + num(f.contractor_profit), 0) / fin.length) : 0,
        additional_revenue: r2(fin.reduce((s, f) => s + num(f.additional_revenue), 0)),
        margin_pct: (() => {
          const g = fin.reduce((s, f) => s + num(f.final_customer_price), 0);
          return g > 0 ? Math.round((fin.reduce((s, f) => s + num(f.contractor_profit), 0) / g) * 1000) / 10 : 0;
        })(),
        missing_expense_jobs: fin.filter((f) => !f.expenses_verified).length,
      };
      return Response.json({
        partner: { id: partner.id, name: partner.name, city: partner.city },
        jobs: jobs.map((j) => ({ booking_id: j.id, name: j.name, city: j.city, completed: j.created_date, items: j.items_description, payout_paid: j.payout_paid, financial: finByBooking[j.id] ? trimmedJob(finByBooking[j.id]) : null })),
        summary,
        stage_labels: STAGE_LABELS,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('jobFinancials error:', error?.stack || error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}