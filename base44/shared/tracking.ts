// Job lifecycle tracking — the single lifecycle vocabulary shared by every
// function that records or reads tracking events. Stages 1-13 follow the
// service request from inquiry to receipt; exceptions are recorded as events,
// never by rewriting history.

export const STAGE_STEPS = {
  inquiry_received: 1,
  quote_generated: 2,
  quote_approved: 3,
  payment_captured: 4,
  contractor_matching: 5,
  contractor_assigned: 6,
  contractor_en_route: 7,
  contractor_arrived: 8,
  pickup_in_progress: 9,
  materials_loaded: 10,
  disposal_documented: 11,
  job_completed: 12,
  receipt_issued: 13,
};

export const STAGE_LABELS = {
  inquiry_received: 'Service request received',
  quote_generated: 'Quote generated',
  quote_approved: 'Customer approval received',
  payment_captured: 'Payment authorized or collected',
  contractor_matching: 'Contractor matching initiated',
  contractor_assigned: 'Contractor assigned',
  contractor_en_route: 'Contractor en route',
  contractor_arrived: 'Contractor arrived',
  pickup_in_progress: 'Pickup in progress',
  materials_loaded: 'Materials loaded',
  disposal_documented: 'Disposal or recycling documented',
  job_completed: 'Job completed',
  receipt_issued: 'Receipt issued',
};

export const EXCEPTION_STAGES = [
  'exception_cancelled',
  'exception_rescheduled',
  'exception_payment_failed',
  'exception_price_adjusted',
  'exception_additional_items',
  'exception_other',
];

// Stages an admin can record manually (field updates without another data source).
export const MANUAL_STAGES = [
  'contractor_en_route',
  'contractor_arrived',
  'pickup_in_progress',
  'materials_loaded',
  ...EXCEPTION_STAGES,
];

// Records a lifecycle event. Non-exception stages are idempotent per booking:
// the first record wins, so re-running a flow never duplicates history.
export async function recordTrackingEvent(srole, ev) {
  const stage = String(ev.stage || '');
  if (!STAGE_STEPS[stage] && !EXCEPTION_STAGES.includes(stage)) {
    throw new Error('Unknown lifecycle stage: ' + stage);
  }
  if (!ev.booking_id) throw new Error('booking_id is required to record a tracking event.');
  const exception = EXCEPTION_STAGES.includes(stage);
  if (!exception) {
    const existing = await srole.entities.TrackingEvent.filter({ booking_id: ev.booking_id, stage }, { limit: 1 });
    const list = Array.isArray(existing) ? existing : (existing.items || []);
    if (list.length) return list[0];
  }
  return srole.entities.TrackingEvent.create({
    booking_id: ev.booking_id,
    reference_code: String(ev.reference_code || '').slice(0, 12),
    stage,
    exception,
    title: String(ev.title || STAGE_LABELS[stage] || stage).slice(0, 200),
    actor: String(ev.actor || 'system').slice(0, 120),
    source: String(ev.source || 'system').slice(0, 60),
    note: String(ev.note || '').slice(0, 1000),
    occurred_at: ev.occurred_at || new Date().toISOString(),
  });
}

// Derives the stages already proven by the job's own stored state. Derived
// stages are labelled with their origin so a timeline never looks like it was
// witnessed live when it was reconstructed from records.
export function deriveTimeline(b, custody) {
  const steps = [];
  const push = (stage, occurredAt, note) => {
    if (!occurredAt) return;
    steps.push({
      stage,
      step: STAGE_STEPS[stage],
      label: STAGE_LABELS[stage],
      occurred_at: occurredAt,
      derived: true,
      note: note || 'Reconstructed from the job record.',
    });
  };
  const isBooking = b.record_type !== undefined || b.assignment_status !== undefined;
  push('inquiry_received', b.created_date);
  if (b.quote_estimate || b.quote_amount || b.quote_status === 'sent') {
    push('quote_generated', b.created_date);
  }
  if (Number(b.approved_quote_amount) > 0 || b.approval_date || b.quote_status === 'approved') {
    push('quote_approved', b.approval_date || b.updated_date);
  }
  if (['paid', 'paid_externally'].includes(b.payment_status)) {
    push('payment_captured', b.updated_date);
  }
  if (!isBooking && ['provider_matching', 'recruiting'].includes(b.status)) {
    push('contractor_matching', b.updated_date);
  }
  if (!isBooking && ['contractor_contacted', 'contractor_accepted', 'pickup_scheduled'].includes(b.dispatch_status)) {
    push('contractor_matching', b.updated_date);
  }
  if (b.partner_id || b.partner_name) {
    push('contractor_assigned', b.updated_date);
  }
  if (b.pickup_confirmed) {
    push('pickup_in_progress', b.updated_date);
  }
  if (custody) {
    push('disposal_documented', custody.updated_date || custody.created_date, 'Chain-of-custody record on file.');
  }
  if (
    b.status === 'completed' || b.assignment_status === 'completed' ||
    b.assignment_status === 'paid' || b.dispatch_status === 'job_completed'
  ) {
    push('job_completed', b.updated_date);
  }
  if (b.receipt_sent) {
    push('receipt_issued', b.updated_date);
  }
  return steps;
}