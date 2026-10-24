// Shared lifecycle vocabulary for the operations UI (admin + customer portal).
// Mirrors base44/shared/tracking.ts stage ids.

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

export const EXCEPTION_LABELS = {
  exception_cancelled: 'Cancelled',
  exception_rescheduled: 'Rescheduled',
  exception_payment_failed: 'Payment failed',
  exception_price_adjusted: 'Price adjusted',
  exception_additional_items: 'Additional items added',
  exception_other: 'Other exception',
};

export const labelFor = (s) => STAGE_LABELS[s] || EXCEPTION_LABELS[s] || s;

export const PAYMENT_LABELS = {
  none: 'Not yet paid',
  paid: 'Paid',
  paid_externally: 'Paid outside the platform',
  refunded: 'Refunded',
};