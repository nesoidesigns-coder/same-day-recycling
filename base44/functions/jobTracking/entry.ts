import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import {
  recordTrackingEvent, deriveTimeline, EXCEPTION_STAGES, MANUAL_STAGES, STAGE_LABELS,
} from '../../shared/tracking.ts';

// Job lifecycle tracking service.
//   lookup       (public)  customer tracks their own job by reference code
//   ops          (admin)   national operations command-center snapshot
//   timeline     (admin)   full merged lifecycle timeline for one job
//   record       (admin)   record a field event or an exception
//   custody_get  (admin)   chain-of-custody record for one job
//   custody_save (admin)   create or verify a chain-of-custody record
// Timeline stages are derived from the job's own records; TrackingEvent rows
// add witnessed events and exceptions. Nothing is estimated or invented.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || '';
    const srole = base44.asServiceRole;

    if (action === 'lookup') return await lookup(base44, srole, req, body);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'ops') return await opsSnapshot(srole);
    if (action === 'timeline') return await timelineFor(srole, body);
    if (action === 'record') return await recordEvent(srole, body, user);
    if (action === 'custody_get') return await custodyGet(srole, body);
    if (action === 'custody_save') return await custodySave(srole, body, user);
    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ---- Public customer tracking (random reference code is the only key) ----
async function lookup(base44, srole, req, body) {
  const limited = await checkRateLimit(base44, req, 'jobTracking', 10);
  if (!limited.allowed) return rateLimitedResponse();
  const code = String(body?.reference_code || '').trim().toUpperCase().slice(0, 12);
  if (!/^[A-Z0-9]{6,12}$/.test(code)) {
    return Response.json({ error: 'Enter the reference code from your confirmation.' }, { status: 400 });
  }

  const { items: bItems } = await srole.entities.Booking.filter({ reference_code: code }, { limit: 1 });
  if (bItems && bItems[0]) return bookingPortal(srole, bItems[0], code);

  const { items: rItems } = await srole.entities.NationalRequest.filter({ reference_code: code }, { limit: 1 });
  const r = rItems && rItems[0];
  if (!r) return Response.json({ found: false });

  const events = await loadEvents(srole, code);
  return Response.json({
    found: true,
    request: {
      kind: 'national',
      reference_code: code,
      name: r.name,
      city: r.city || '',
      items_description: r.items_description || '',
      status: r.status,
      partner_name: r.partner_name || '',
      assignment_status: '',
      preferred_date: r.preferred_date || '',
      time_window: '',
      approved_quote_amount: r.quote_amount || 0,
      payment_status: 'none',
      receipt_sent: false,
      timeline: mergeTimeline(r, null, events),
      custody: null,
    },
  });
}

async function bookingPortal(srole, b, code) {
  const [{ items: events }, { items: custodyItems }] = await Promise.all([
    loadEvents(srole, code),
    srole.entities.RecyclingRecord.filter({ booking_id: b.id }, { limit: 1 }),
  ]);
  const custody = custodyItems[0] || null;
  return Response.json({
    found: true,
    request: {
      kind: 'booking',
      reference_code: code,
      name: b.name,
      city: b.city || '',
      items_description: b.items_description || '',
      status: b.status,
      partner_name: b.partner_name || '',
      assignment_status: b.assignment_status || '',
      preferred_date: b.preferred_date || '',
      time_window: b.time_window || '',
      approved_quote_amount: b.approved_quote_amount || 0,
      job_value: b.job_value || 0,
      payment_status: b.payment_status || 'none',
      receipt_sent: !!b.receipt_sent,
      timeline: mergeTimeline(b, custody, events),
      custody: custody ? publicCustody(custody) : null,
    },
  });
}

async function loadEvents(srole, code) {
  const page = await srole.entities.TrackingEvent.filter({ reference_code: code }, { sort: '-created_date', limit: 200 });
  return (page.items || page || []).slice().reverse();
}

function mergeTimeline(job, custody, events) {
  const derived = deriveTimeline(job, custody);
  const explicit = (events || []).map((e) => ({
    stage: e.stage,
    step: e.exception ? 0 : (stageStep(e.stage) || 0),
    label: e.title || STAGE_LABELS[e.stage] || e.stage,
    occurred_at: e.occurred_at || e.created_date,
    derived: false,
    exception: !!e.exception,
    actor: e.actor || '',
    source: e.source || '',
    note: e.note || '',
  }));
  const explicitStages = new Set(explicit.map((e) => e.stage));
  const merged = [...derived.filter((d) => !explicitStages.has(d.stage)), ...explicit];
  return merged.sort((a, b2) => String(a.occurred_at || '').localeCompare(String(b2.occurred_at || '')));
}

const STEP_INDEX = Object.fromEntries(
  Object.entries({
    inquiry_received: 1, quote_generated: 2, quote_approved: 3, payment_captured: 4,
    contractor_matching: 5, contractor_assigned: 6, contractor_en_route: 7, contractor_arrived: 8,
    pickup_in_progress: 9, materials_loaded: 10, disposal_documented: 11, job_completed: 12, receipt_issued: 13,
  }).map(([k, v]) => [k, v]),
);
const stageStep = (s) => STEP_INDEX[s] || 0;

function publicCustody(c) {
  return {
    pickup_date: c.pickup_date || '',
    material_categories: c.material_categories || {},
    total_item_groups: c.total_item_groups || 0,
    diverted_groups: c.diverted_groups || 0,
    diversion_percent: c.diversion_percent || 0,
    estimated_weight_kg: c.estimated_weight_kg || 0,
    weight_source: c.weight_source || 'not_measured',
    destination_facility: c.destination_facility || '',
    documentation_status: c.documentation_status || 'reported',
  };
}

// ---- National operations command center ----
function netOf(b) {
  const v = Number(b.job_value) || 0;
  const rule = String(b.fee_terms_snapshot?.rule || '');
  let fee = 0;
  if (rule.startsWith('percentage_')) fee = (v * (Number(rule.split('_')[1]) || 0)) / 100;
  else if (rule.startsWith('fixed_')) fee = Number(rule.split('_')[1]) || 0;
  else if (b.referred_by_admin) fee = (v * (Number(b.commission_rate) || 0)) / 100;
  return Math.max(0, v - fee - (Number(b.refund_amount) || 0));
}

async function opsSnapshot(srole) {
  const today = new Date().toISOString().slice(0, 10);
  const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
  const [bookingsPage, statusAgg, revenueAgg, partnersPage, exceptionsPage, payoutPage, custodyPage, reqAgg] = await Promise.all([
    srole.entities.Booking.filter({ record_type: { $ne: 'internal_test' } }, { sort: '-created_date', limit: 150 }),
    srole.entities.Booking.aggregate({ query: { record_type: { $ne: 'internal_test' } }, groupBy: 'status' }),
    srole.entities.Booking.aggregate({ query: { record_type: { $ne: 'internal_test' }, payment_status: { $in: ['paid', 'paid_externally'] } }, sum: ['final_invoice', 'job_value'] }),
    srole.entities.Partner.filter({ active: true }, { limit: 100 }),
    srole.entities.TrackingEvent.filter({ exception: true }, { sort: '-created_date', limit: 12 }),
    srole.entities.Booking.filter({ record_type: { $ne: 'internal_test' }, assignment_status: 'completed', payout_paid: { $ne: true } }, { sort: '-created_date', limit: 200 }),
    srole.entities.RecyclingRecord.filter({}, { sort: '-created_date', limit: 500 }),
    srole.entities.NationalRequest.aggregate({ query: { record_type: { $ne: 'internal_test' } }, groupBy: 'status' }),
  ]);

  const bookings = bookingsPage.items || [];
  const custodyByBooking = Object.fromEntries((custodyPage.items || []).map((c) => [c.booking_id, c]));
  const completed = bookings.filter((b) => b.status === 'completed');
  const missingCustody = completed.filter((b) => !custodyByBooking[b.id]);
  const delayed = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status) && b.preferred_date && b.preferred_date < today);
  const unassignedConfirmed = bookings.filter((b) => ['confirmed', 'scheduled'].includes(b.status) && !b.partner_id);
  const staleNew = bookings.filter((b) => b.status === 'new' && b.created_date < twoDaysAgo);

  const problems = [];
  if (delayed.length) problems.push({ severity: 'warning', title: 'Delayed pickups', detail: `${delayed.length} active jobs have a scheduled date in the past.`, records: delayed.slice(0, 10).map((b) => b.reference_code || b.id) });
  if (unassignedConfirmed.length) problems.push({ severity: 'warning', title: 'Confirmed but unassigned', detail: `${unassignedConfirmed.length} confirmed bookings have no contractor yet.`, records: unassignedConfirmed.slice(0, 10).map((b) => b.reference_code || b.id) });
  if (missingCustody.length) problems.push({ severity: 'warning', title: 'Missing disposal documentation', detail: `${missingCustody.length} completed jobs have no chain-of-custody record.`, records: missingCustody.slice(0, 10).map((b) => b.reference_code || b.id) });
  if (staleNew.length) problems.push({ severity: 'info', title: 'Stale new requests', detail: `${staleNew.length} requests arrived more than 48 hours ago and are still unactioned.`, records: staleNew.slice(0, 10).map((b) => b.reference_code || b.id) });

  const revRows = revenueAgg?.rows || [];
  const payoutTotal = (payoutPage.items || []).reduce((s, b) => s + netOf(b), 0);

  return Response.json({
    generated_at: new Date().toISOString(),
    gauges: {
      active_jobs: bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length,
      awaiting_acceptance: bookings.filter((b) => b.assignment_status === 'assigned').length,
      in_progress: bookings.filter((b) => b.assignment_status === 'accepted' && b.status !== 'completed').length,
      completed_total: (statusAgg?.rows || []).find((r) => r._id === 'completed')?.count || 0,
      revenue_collected: revRows.reduce((s, r) => s + (Number(r.sum_final_invoice) || 0), 0),
      revenue_collected_jobs: revRows.reduce((s, r) => s + (Number(r.count) || 0), 0),
      pending_payouts_net: Math.round(payoutTotal * 100) / 100,
      contractors_available: (partnersPage.items || []).length,
      open_dispatch_requests: (reqAgg?.rows || []).filter((r) => ['new', 'provider_matching', 'recruiting'].includes(r._id)).reduce((s, r) => s + (Number(r.count) || 0), 0),
      custody_verified: (custodyPage.items || []).filter((c) => c.documentation_status === 'verified').length,
      custody_reported: (custodyPage.items || []).filter((c) => c.documentation_status !== 'verified').length,
      missing_custody: missingCustody.length,
      delayed_jobs: delayed.length,
    },
    bookings: bookings.map((b) => {
      const custody = custodyByBooking[b.id] || null;
      const derived = deriveTimeline(b, custody).filter((d) => d.stage !== 'receipt_issued');
      const lastStage = derived[derived.length - 1] || null;
      return {
        id: b.id,
        reference_code: b.reference_code || '',
        name: b.name || '',
        city: b.city || '',
        province_code: b.province_code || '',
        status: b.status || '',
        assignment_status: b.assignment_status || '',
        partner_name: b.partner_name || '',
        partner_id: b.partner_id || '',
        preferred_date: b.preferred_date || '',
        job_value: Number(b.job_value) || 0,
        final_invoice: Number(b.final_invoice) || 0,
        payment_status: b.payment_status || 'none',
        created_date: b.created_date,
        current_stage: lastStage ? lastStage.stage : '',
        current_step: lastStage ? lastStage.step : 0,
        has_custody: !!custody,
        custody_status: custody ? custody.documentation_status : '',
        is_delayed: delayed.some((d) => d.id === b.id),
      };
    }),
    status_rows: statusAgg?.rows || [],
    request_rows: reqAgg?.rows || [],
    partners: (partnersPage.items || []).map((p) => ({ id: p.id, name: p.name || '', city: p.city || '' })),
    exceptions: (exceptionsPage.items || []).map((e) => ({
      id: e.id, stage: e.stage, title: e.title, actor: e.actor, source: e.source,
      note: e.note, occurred_at: e.occurred_at, reference_code: e.reference_code || '',
    })),
    problems,
  });
}

// ---- Admin timeline + event recording ----
async function timelineFor(srole, body) {
  const booking = await getJob(srole, String(body.booking_id || ''));
  if (!booking) return Response.json({ error: 'Job not found.' }, { status: 404 });
  const [{ items: events }, { items: custodyItems }] = await Promise.all([
    srole.entities.TrackingEvent.filter({ booking_id: booking.id }, { sort: '-created_date', limit: 200 }).then((p) => ({ items: (p.items || []).slice().reverse() })),
    srole.entities.RecyclingRecord.filter({ booking_id: booking.id }, { limit: 1 }),
  ]);
  return Response.json({
    booking: {
      id: booking.id,
      reference_code: booking.reference_code || '',
      name: booking.name || '',
      city: booking.city || '',
      status: booking.status || '',
      assignment_status: booking.assignment_status || '',
      partner_name: booking.partner_name || '',
      preferred_date: booking.preferred_date || '',
      payment_status: booking.payment_status || 'none',
      approved_quote_amount: booking.approved_quote_amount || 0,
      job_value: booking.job_value || 0,
      items_description: booking.items_description || '',
    },
    timeline: mergeTimeline(booking, custodyItems[0] || null, events),
    custody: custodyItems[0] || null,
  });
}

async function getJob(srole, id) {
  if (!id) return null;
  const b = await srole.entities.Booking.get(id);
  if (b) return b;
  return srole.entities.NationalRequest.get(id);
}

async function recordEvent(srole, body, user) {
  const stage = String(body.stage || '');
  if (!MANUAL_STAGES.includes(stage)) {
    return Response.json({ error: 'This stage is recorded automatically; only field updates and exceptions are entered manually.' }, { status: 400 });
  }
  const booking = await getJob(srole, String(body.booking_id || ''));
  if (!booking) return Response.json({ error: 'Job not found.' }, { status: 404 });
  const event = await recordTrackingEvent(srole, {
    booking_id: booking.id,
    reference_code: booking.reference_code || '',
    stage,
    actor: user.full_name || 'Admin',
    source: 'admin',
    note: String(body.note || '').slice(0, 1000),
    occurred_at: body.occurred_at || new Date().toISOString(),
  });
  return Response.json({ ok: true, event });
}

// ---- Chain of custody (admin) ----
async function custodyGet(srole, body) {
  const booking = await getJob(srole, String(body.booking_id || ''));
  if (!booking) return Response.json({ error: 'Job not found.' }, { status: 404 });
  const { items } = await srole.entities.RecyclingRecord.filter({ booking_id: booking.id }, { limit: 1 });
  return Response.json({ custody: items[0] || null, job: publicJobRef(booking) });
}

function publicJobRef(b) {
  return {
    id: b.id,
    reference_code: b.reference_code || '',
    name: b.name || '',
    city: b.city || '',
    items_description: b.items_description || '',
  };
}

async function custodySave(srole, body, user) {
  const booking = await getJob(srole, String(body.booking_id || ''));
  if (!booking) return Response.json({ error: 'Job not found.' }, { status: 404 });
  const cats = body.material_categories && typeof body.material_categories === 'object' ? body.material_categories : {};
  const totalGroups = Math.max(0, Number(body.total_item_groups) || 0);
  const diverted = Math.min(totalGroups, Math.max(0, Number(body.diverted_groups) || 0));
  const weight = Math.max(0, Number(body.estimated_weight_kg) || 0);
  const weightSource = ['not_measured', 'estimated', 'measured'].includes(body.weight_source)
    ? body.weight_source
    : (weight > 0 ? 'estimated' : 'not_measured');
  const verify = body.verify === true;
  const payload = {
    booking_id: booking.id,
    job_ref: booking.reference_code || '',
    customer_name: booking.name || '',
    city: booking.city || '',
    province_code: booking.province_code || '',
    pickup_date: booking.preferred_date || new Date().toISOString().slice(0, 10),
    material_categories: cats,
    total_item_groups: totalGroups,
    diverted_groups: diverted,
    diversion_percent: totalGroups > 0 ? Math.round((diverted / totalGroups) * 100) : 0,
    estimated_weight_kg: weight,
    weight_source: weightSource,
    destination_facility: String(body.destination_facility || '').trim().slice(0, 200),
    disposal_receipt_uri: String(body.disposal_receipt_uri || '').trim().slice(0, 500),
    documentation_status: verify ? 'verified' : 'reported',
    verified_by: verify ? (user.full_name || 'Admin') : '',
    verified_date: verify ? new Date().toISOString().slice(0, 10) : '',
    notes: String(body.notes || '').slice(0, 1000),
  };
  const { items } = await srole.entities.RecyclingRecord.filter({ booking_id: booking.id }, { limit: 1 });
  const record = items[0]
    ? await srole.entities.RecyclingRecord.update(items[0].id, payload)
    : await srole.entities.RecyclingRecord.create(payload);
  if (EXCEPTION_STAGES.includes(String(body.exception_stage || ''))) {
    await recordTrackingEvent(srole, {
      booking_id: booking.id,
      reference_code: booking.reference_code || '',
      stage: body.exception_stage,
      actor: user.full_name || 'Admin',
      source: 'admin',
      note: String(body.exception_note || '').slice(0, 1000),
    });
  }
  await recordTrackingEvent(srole, {
    booking_id: booking.id,
    reference_code: booking.reference_code || '',
    stage: 'disposal_documented',
    actor: verify ? (user.full_name || 'Admin') : (user.full_name || 'Admin') + ' (entry)',
    source: 'admin',
    note: verify ? 'Chain-of-custody record verified by an administrator.' : 'Chain-of-custody record filed, awaiting verification.',
  });
  return Response.json({ ok: true, custody: record });
}