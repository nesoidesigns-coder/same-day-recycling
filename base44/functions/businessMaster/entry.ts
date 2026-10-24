import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const pick = (r) => (r.status === 'fulfilled' ? (r.value?.data ?? r.value) : null);
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const question = String(payload.question || '').trim().slice(0, 2000);
    if (!question) return Response.json({ error: 'A question is required.' }, { status: 400 });
    const learning = payload.learning_mode === true;

    // Verified context from the EXISTING intelligence sources — read-only.
    const settled = await Promise.allSettled([
      base44.functions.invoke('businessLifetime', {}),
      base44.functions.invoke('conversionFunnel', { days: 30 }),
      base44.functions.invoke('coverageStatus', {}),
      base44.entities.BusinessMemory.list({ limit: 30, sort: '-created_date' }),
    ]);
    const lifetime = pick(settled[0]);
    const funnel = pick(settled[1]);
    const coverage = pick(settled[2]);
    const memory = pick(settled[3]);

    const L = lifetime?.lifetime || {};
    const context = {
      business: {
        name: 'Same Day Recycling (Recycling OS)',
        model: 'Canadian junk removal & recycling marketplace: dispatches jobs to vetted contractor partners and earns a commission per job; also sells Recycling OS software subscriptions and white-label licensing; same-day pickup focus.',
        inception_date: lifetime?.inception_date || null,
      },
      lifetime_finance: lifetime ? {
        revenue_basis: L.revenue_basis,
        total_revenue: L.total_revenue,
        commissions: L.commissions,
        os_software_revenue: L.os_software_revenue,
        contractor_payouts: L.contractor_payouts,
        expenses_paid: L.expenses_paid,
        gross_profit: L.gross_profit,
        net_profit_estimate: L.net_profit_estimate,
        completed_jobs: L.completed_jobs,
        total_bookings: L.total_bookings,
        unique_customers: L.unique_customers,
        active_contractors: L.active_contractors,
        avg_commission_per_job: L.avg_commission_per_job,
        avg_job_value: L.avg_job_value,
        avg_monthly_completed_jobs: L.avg_monthly_completed_jobs,
        avg_monthly_expenses: L.avg_monthly_expenses,
        receivable: lifetime.receivable,
        payable: lifetime.payable,
        revenue_by_category: lifetime.revenue_by_category,
        expenses_by_category: lifetime.expenses_by_category,
        by_city: (lifetime.by_city || []).slice(0, 8),
        by_province: (lifetime.by_province || []).slice(0, 8),
        contractors_top: (lifetime.contractors || []).slice(0, 8),
        monthly_recent: (lifetime.monthly || []).slice(-12),
        basis_note: lifetime.basis_note,
      } : { unavailable: true },
      funnel_30d: funnel && !funnel.unavailable ? {
        visits_by_class: funnel.funnel?.visits?.by_class,
        quote_leads: funnel.funnel?.quote_leads,
        booking_requests: funnel.funnel?.booking_requests,
        completed: funnel.funnel?.completed,
        rates: funnel.rates,
        top_cities: (funnel.cities || []).slice(0, 5),
      } : { unavailable: true },
      coverage: coverage && !coverage.unavailable ? {
        verified_cities: coverage.verified_cities?.length ?? 0,
        matching_cities: coverage.matching_cities?.length ?? 0,
        unavailable_cities: coverage.unavailable_cities?.length ?? null,
      } : { unavailable: true },
      business_memory_recent: (memory && !memory.unavailable ? (memory.items || []) : []).slice(0, 10).map((m) => ({ type: m.entry_type, title: m.title, date: m.entry_date })),
    };

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the AI Business Master for Same Day Recycling (Recycling OS, samedayrecycling.ca) — the owner\'s business strategist, financial analyst, operations advisor and educator.\n' +
        'You understand: Canadian junk removal and recycling operations; national contractor networks and regional service coverage; customer acquisition, pricing, dispatch and service fulfillment; commission-based revenue; Recycling OS software subscriptions and white-label licensing; Canadian business finance, accounting, taxation and regulatory obligations; business strategy, risk management and sustainable growth.\n' +
        'Operating philosophy: business success is cumulative. Measure progress from the actual history, never pressure for immediate massive growth. Prioritize stability, customer satisfaction, profitability and sustainable growth over aggressive expansion.\n\n' +
        'STRICT RULES:\n' +
        '- Use ONLY the verified data provided below. Cite the numbers you use (e.g. "your lifetime commissions of $X"). Never invent, estimate silently, or extrapolate without saying so.\n' +
        '- If a source is unavailable, say plainly that it is unavailable. Never fabricate an integration or a live figure.\n' +
        '- A booking is never a payment. Never treat confirmed bookings as received money.\n' +
        '- Keep nationwide market demand separate from company performance.\n' +
        '- For tax, legal or accounting matters: give educational guidance only and state that a professional (accountant or lawyer) should review before acting. Never give definitive tax or legal advice.\n' +
        '- You are advisory only. Never say you will execute, spend, publish, or change anything. Consequential actions require the owner\'s explicit authorization elsewhere in the system.\n' +
        '- Disclose uncertainty and data limitations honestly.\n' +
        (learning
          ? '- LEARNING MODE IS ON: assume the owner has NO prior business education. Define every business term in plain language the first time you use it, build the explanation step by step, use a concrete Recycling OS example from the verified numbers when available, and end with one short self-check question so the owner can test understanding. Keep a warm, encouraging tone.\n'
          : '- Learning mode is off: answer directly and concisely (under ~300 words) unless the question genuinely needs depth.\n') +
        '\nVERIFIED CONTEXT (JSON):\n' + JSON.stringify(context) +
        '\n\nOWNER QUESTION: ' + question,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          data_basis: { type: 'array', items: { type: 'string' } },
          unavailable: { type: 'array', items: { type: 'string' } },
          next_action: { type: 'string' },
        },
        required: ['answer'],
      },
    });

    const result = {
      answer: String(ai.answer || '').slice(0, 8000),
      data_basis: (ai.data_basis || []).slice(0, 10),
      unavailable: (ai.unavailable || []).slice(0, 10),
      next_action: ai.next_action ? String(ai.next_action).slice(0, 500) : null,
      learning_mode: learning,
      generated_at: new Date().toISOString(),
    };

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}