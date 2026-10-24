import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => (Number(v) || 0);
const items = (r) => (r && r.items ? r.items : r || []);
const monthOf = (d) => String(d || '').slice(0, 7);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [bookingsPage, ledgerPage, txPage, partnersPage, memoryPage] = await Promise.all([
      base44.entities.Booking.filter({ record_type: 'service' }, { limit: 2000, sort: '-created_date' }),
      base44.entities.RevenueLedger.list({ limit: 2000, sort: '-created_date' }),
      base44.entities.FinancialTx.filter({ owner_type: 'sdr_admin' }, { limit: 2000, sort: '-created_date' }),
      base44.entities.Partner.filter({}, { limit: 500 }),
      base44.entities.BusinessMemory.list({ limit: 300, sort: '-created_date' }),
    ]);
    const bookings = items(bookingsPage);
    const ledger = items(ledgerPage);
    const txs = items(txPage);
    const partners = items(partnersPage);
    const memory = items(memoryPage);

    const completed = bookings.filter((b) => b.status === 'completed');
    const bookingCommission = round(completed.reduce((n, b) => n + num(b.commission_earned), 0));
    const bookingJobValue = round(completed.reduce((n, b) => n + num(b.final_invoice), 0));

    // Verified revenue from the owner-maintained RevenueLedger; when the ledger
    // has no entries yet, fall back to completed booking records and label it.
    const revenueRows = ledger.filter((l) => l.direction === 'revenue');
    const byCategory = {};
    for (const l of revenueRows) byCategory[l.category] = round((byCategory[l.category] || 0) + num(l.amount));
    const commissionLedger = byCategory.job_commission || 0;
    const osRevenue = round((byCategory.membership || 0) + (byCategory.software_subscription || 0) + (byCategory.software_setup || 0));
    const otherRevenue = byCategory.other || 0;
    const ledgerRevenue = round(revenueRows.reduce((n, l) => n + num(l.amount), 0));

    const payouts = round(ledger.filter((l) => l.direction === 'payout').reduce((n, l) => n + num(l.amount), 0));
    const refunds = round(ledger.filter((l) => l.direction === 'refund').reduce((n, l) => n + num(l.amount), 0));

    const expensePaidRows = txs.filter((t) => t.kind === 'expense' && t.status === 'paid');
    const expensePaid = round(expensePaidRows.reduce((n, t) => n + num(t.amount), 0));
    const payable = round(txs.filter((t) => t.kind === 'expense' && t.status === 'outstanding').reduce((n, t) => n + num(t.amount), 0));
    const incomeRows = txs.filter((t) => t.kind === 'income' && t.status === 'paid');
    const directIncome = round(incomeRows.reduce((n, t) => n + num(t.amount), 0));
    const receivable = round(txs.filter((t) => t.kind === 'income' && t.status === 'outstanding').reduce((n, t) => n + num(t.amount), 0));

    const expenseByCat = {};
    for (const t of expensePaidRows) {
      const k = t.category || 'other';
      expenseByCat[k] = round((expenseByCat[k] || 0) + num(t.amount));
    }

    const useLedger = revenueRows.length > 0;
    const totalRevenue = useLedger ? round(ledgerRevenue + directIncome) : round(bookingCommission + directIncome);
    const grossProfit = round(totalRevenue - payouts);
    const netEstimate = round(grossProfit - expensePaid);

    // Breakdowns from completed booking records.
    const byCityMap = {};
    for (const b of completed) {
      const k = b.city || 'Unknown';
      const row = byCityMap[k] = byCityMap[k] || { city: k, completed: 0, revenue: 0, commission: 0 };
      row.completed += 1;
      row.revenue = round(row.revenue + num(b.final_invoice));
      row.commission = round(row.commission + num(b.commission_earned));
    }
    const byProvinceMap = {};
    for (const b of completed) {
      const k = b.province_code || 'Unknown';
      const row = byProvinceMap[k] = byProvinceMap[k] || { province: k, completed: 0, revenue: 0, commission: 0 };
      row.completed += 1;
      row.revenue = round(row.revenue + num(b.final_invoice));
      row.commission = round(row.commission + num(b.commission_earned));
    }
    const by_city = Object.values(byCityMap).sort((a, b) => b.revenue - a.revenue);
    const by_province = Object.values(byProvinceMap).sort((a, b) => b.revenue - a.revenue);

    // Monthly series: revenue/commissions from ledger dates (or completed-booking
    // updated dates as a labeled proxy when the ledger is empty), expenses from
    // transaction dates. Completion timing uses the record's last-update date.
    const months = {};
    const bump = (m) => {
      if (!m) return null;
      months[m] = months[m] || { month: m, revenue: 0, commissions: 0, expenses: 0, jobs: 0 };
      return months[m];
    };
    for (const l of revenueRows) {
      const row = bump(monthOf(l.occurred_date));
      if (row) {
        row.revenue += num(l.amount);
        if (l.category === 'job_commission') row.commissions += num(l.amount);
      }
    }
    if (!useLedger) {
      for (const b of completed) {
        const row = bump(monthOf(b.updated_date));
        if (row) {
          row.revenue += num(b.commission_earned);
          row.commissions += num(b.commission_earned);
        }
      }
    }
    for (const t of expensePaidRows) {
      const row = bump(monthOf(t.tx_date));
      if (row) row.expenses += num(t.amount);
    }
    for (const b of completed) {
      const row = bump(monthOf(b.updated_date));
      if (row) row.jobs += 1;
    }
    const monthly = Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
      .map((r) => ({ month: r.month, revenue: round(r.revenue), commissions: round(r.commissions), expenses: round(r.expenses), jobs: r.jobs }));
    const yearsMap = {};
    for (const r of monthly) {
      const y = r.month.slice(0, 4);
      const row = yearsMap[y] = yearsMap[y] || { year: y, revenue: 0, commissions: 0, expenses: 0 };
      row.revenue = round(row.revenue + r.revenue);
      row.commissions = round(row.commissions + r.commissions);
      row.expenses = round(row.expenses + r.expenses);
    }
    const yearly = Object.values(yearsMap).sort((a, b) => a.year.localeCompare(b.year));

    // Contractor performance across all dispatched jobs.
    const contractorMap = {};
    for (const b of bookings) {
      const k = b.partner_name || 'Unassigned';
      const row = contractorMap[k] = contractorMap[k] || { name: k, assigned: 0, completed: 0, revenue: 0, commission: 0, last: '' };
      row.assigned += 1;
      if (b.status === 'completed') {
        row.completed += 1;
        row.revenue = round(row.revenue + num(b.final_invoice));
        row.commission = round(row.commission + num(b.commission_earned));
      }
      const stamp = String(b.updated_date || b.created_date || '');
      if (stamp > row.last) row.last = stamp;
    }
    const contractors = Object.values(contractorMap).sort((a, b) => b.assigned - a.assigned);

    const dates = bookings.map((b) => b.created_date).filter(Boolean).sort();
    const inception = dates[0] ? String(dates[0]).slice(0, 10) : null;
    const monthsActive = inception
      ? Math.max(1, Math.ceil((Date.now() - new Date(`${inception}T00:00:00Z`).getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
      : 1;
    const customers = new Set(bookings.map((b) => String(b.phone || '').trim()).filter(Boolean)).size;

    const avg_commission_per_job = completed.length ? round(bookingCommission / completed.length) : 0;
    const avg_job_value = completed.length ? round(bookingJobValue / completed.length) : 0;

    return Response.json({
      generated_at: new Date().toISOString(),
      inception_date: inception,
      lifetime: {
        total_revenue: totalRevenue,
        revenue_basis: useLedger ? 'verified_ledger' : 'booking_estimate',
        commissions: round(useLedger ? commissionLedger : bookingCommission),
        commissions_basis: useLedger ? 'verified_ledger' : 'booking_estimate',
        os_software_revenue: osRevenue,
        other_revenue: otherRevenue,
        direct_income: directIncome,
        contractor_payouts: payouts,
        refunds,
        expenses_paid: expensePaid,
        gross_profit: grossProfit,
        net_profit_estimate: netEstimate,
        completed_jobs: completed.length,
        total_bookings: bookings.length,
        unique_customers: customers,
        active_contractors: partners.filter((p) => p.active).length,
        total_contractors: partners.length,
        avg_commission_per_job,
        avg_job_value,
        avg_monthly_completed_jobs: round(completed.length / monthsActive),
        avg_monthly_expenses: round(expensePaid / monthsActive),
        avg_monthly_os_revenue: round(osRevenue / monthsActive),
      },
      revenue_by_category: byCategory,
      expenses_by_category: expenseByCat,
      receivable,
      payable,
      monthly,
      yearly,
      by_city,
      by_province,
      contractors,
      timeline: memory.map((e) => ({ id: e.id, entry_type: e.entry_type, title: e.title, detail: e.detail, entry_date: e.entry_date, source: e.source })),
      basis_note: useLedger
        ? 'Revenue and commissions are verified RevenueLedger entries; operational counts come from booking records. A completed booking is never treated as payment by itself.'
        : 'Estimate fallback: no RevenueLedger entries exist yet, so revenue and commissions are computed from completed booking records (commission_earned). Record verified transactions in the finance ledger to convert these into verified totals.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}