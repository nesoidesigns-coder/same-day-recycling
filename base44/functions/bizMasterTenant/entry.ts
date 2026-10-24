import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const pick = (r) => (r.status === 'fulfilled' ? (r.value?.data ?? r.value) : null);
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => (Number(v) || 0);
const items = (r) => (r && r.items ? r.items : Array.isArray(r) ? r : []);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const question = String(payload.question || '').trim().slice(0, 2000);
    if (!question) return Response.json({ error: 'A question is required.' }, { status: 400 });
    const learning = payload.learning_mode === true;

    // TENANT SCOPE: only records anchored to this exact signed-in email.
    // Partner (service-network) records resolve by partner.email; software
    // tenant records resolve by license_email / owner_email. Any other
    // contractor's data is never queried, never returned.
    const partners = items(await base44.asServiceRole.entities.Partner.filter({ email: user.email }));
    const partner = partners[0] && partners[0].active !== false ? partners[0] : null;
    const licenses = items(await base44.asServiceRole.entities.SoftwareLicense.filter({ email: user.email }));
    const license = licenses[0] || null;

    if (!partner && !license) {
      return Response.json({ error: 'No contractor or software account is linked to this email. Contact the Same Day Recycling team.' }, { status: 403 });
    }

    // Software-tenant operating records (their own console data).
    const [customers, invoices, pickups, ownTx] = await Promise.all([
      base44.asServiceRole.entities.LicenseCustomer.count({ license_email: user.email }),
      base44.asServiceRole.entities.LicenseInvoice.filter({ license_email: user.email }, { limit: 500 }),
      base44.asServiceRole.entities.LicensePickup.filter({ license_email: user.email }, { limit: 500 }),
      base44.asServiceRole.entities.FinancialTx.filter({ owner_email: user.email }, { limit: 500 }),
    ]);
    const invoiceRows = items(invoices);
    const pickupRows = items(pickups);
    const txRows = items(ownTx);
    const pickupCounts = {};
    for (const p of pickupRows) {
      const k = String(p.customer_name || '').trim();
      if (k) pickupCounts[k] = (pickupCounts[k] || 0) + 1;
    }
    const repeatCustomers = Object.values(pickupCounts).filter((n) => n > 1).length;

    const revenueCollected = round(invoiceRows.filter((i) => i.status === 'paid').reduce((n, i) => n + num(i.amount), 0));
    const revenueOutstanding = round(invoiceRows.filter((i) => i.status === 'sent' || i.status === 'draft').reduce((n, i) => n + num(i.amount), 0));
    const completedPickups = pickupRows.filter((p) => p.status === 'completed').length;

    const income = round(txRows.filter((t) => t.kind === 'income' && t.status === 'paid').reduce((n, t) => n + num(t.amount), 0));
    const expensesPaid = round(txRows.filter((t) => t.kind === 'expense' && t.status === 'paid').reduce((n, t) => n + num(t.amount), 0));
    const expenseCats = {};
    for (const t of txRows.filter((t) => t.kind === 'expense' && t.status === 'paid')) {
      const k = t.category || 'other';
      expenseCats[k] = round((expenseCats[k] || 0) + num(t.amount));
    }

    // Service-network side: their dispatched jobs, if they are a partner.
    let partnerSide = null;
    if (partner) {
      const done = items(await base44.asServiceRole.entities.Booking.filter(
        { partner_id: partner.id, assignment_status: { $in: ['completed', 'paid'] }, record_type: { $ne: 'internal_test' } },
        { limit: 500 }
      ));
      const invoiceOf = (b) => num(b.final_invoice || b.job_value);
      const platformDone = done.filter((b) => b.job_source === 'platform_generated');
      const fees = round(done.reduce((n, b) => n + num(b.platform_fee_amount), 0));
      partnerSide = {
        completed_jobs: done.length,
        platform_generated_jobs: platformDone.length,
        gross_job_value: round(done.reduce((n, b) => n + invoiceOf(b), 0)),
        platform_fees_paid: fees,
        avg_job_value: done.length ? round(done.reduce((n, b) => n + invoiceOf(b), 0) / done.length) : 0,
        effective_acquisition_cost: platformDone.length ? round(fees / platformDone.length) : null,
      };
    }

    const context = {
      who: {
        company: partner?.name || license?.company || 'Unknown',
        city: partner?.city || license?.city || null,
        software_plan: license ? `${license.plan} ($${license.monthly_fee}/mo)` : null,
      },
      software_operations: {
        customers: num(customers),
        repeat_customers: repeatCustomers,
        pickups_total: pickupRows.length,
        pickups_completed: completedPickups,
        invoices_total: invoiceRows.length,
        invoices_paid: invoiceRows.filter((i) => i.status === 'paid').length,
        revenue_collected: revenueCollected,
        revenue_outstanding: revenueOutstanding,
      },
      own_financial_records: {
        income_recorded: income,
        expenses_paid: expensesPaid,
        expenses_by_category: expenseCats,
        net_before_overhead_estimate: round(income - expensesPaid),
        note: txRows.length === 0 ? 'No financial transactions recorded yet in their own books.' : null,
      },
      service_network: partnerSide,
    };

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the AI Business Master (Contractor Edition) inside Recycling OS. You advise ONE independent Canadian junk removal / hauling contractor on their own business: profitability, job costs and pricing, cash flow, operating expenses, customer acquisition costs, revenue opportunities, scheduling efficiency, productivity, business taxes and long-term development.\n' +
        'STRICT RULES:\n' +
        '- Use ONLY the verified data below. Cite the numbers (e.g. "your 12 completed jobs generated $5,100"). Never invent figures, and never present an estimate as a confirmed result.\n' +
        '- Missing data is missing: name what is not recorded (e.g. "no expense records yet, so margins cannot be computed") and suggest recording it.\n' +
        '- Explain your calculations step by step when you derive anything.\n' +
        '- You are advisory only. Never offer to execute anything (spending, messages, invoices) — the contractor decides.\n' +
        '- Tax/accounting questions: educational guidance only, plus a clear note to confirm with an accountant.\n' +
        (learning
          ? '- LEARNING MODE: define business terms in plain language, use this contractor\'s own numbers as the example, end with one self-check question.\n'
          : '- Answer concisely (under ~300 words) unless depth is genuinely needed.\n') +
        '\nCONTRACTOR\'S VERIFIED DATA (JSON):\n' + JSON.stringify(context) +
        '\n\nCONTRACTOR QUESTION: ' + question,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          data_basis: { type: 'array', items: { type: 'string' } },
          missing_data: { type: 'array', items: { type: 'string' } },
          next_action: { type: 'string' },
        },
        required: ['answer'],
      },
    });

    const result = {
      answer: String(ai.answer || '').slice(0, 8000),
      data_basis: (ai.data_basis || []).slice(0, 10),
      missing_data: (ai.missing_data || []).slice(0, 10),
      next_action: ai.next_action ? String(ai.next_action).slice(0, 500) : null,
      learning_mode: learning,
      generated_at: new Date().toISOString(),
    };
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}