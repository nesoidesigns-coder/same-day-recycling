// Client-side mirror of base44/shared/feeEngine.ts, used only to PREVIEW fees
// before assignment. Fees apply only under a contractor's active agreement.

export const JOB_SOURCE_OPTIONS = [
  { value: "platform_generated", label: "Same Day Recycling platform-generated customer" },
  { value: "contractor_generated", label: "Contractor-generated customer" },
  { value: "personal_referral", label: "Personal referral agreement" },
  { value: "repeat_customer", label: "Repeat customer" },
  { value: "other_referral", label: "Other authorized referral source" },
];

export const SOURCE_LABELS = Object.fromEntries(JOB_SOURCE_OPTIONS.map((o) => [o.value, o.label]));

const RULE_KEYS = {
  platform_generated: "platform_generated",
  personal_referral: "personal_referral",
  other_referral: "other_referral",
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function previewFee(agreement, jobSource, jobValue) {
  const none = (rule, disclosure) => ({ fee: 0, rule, disclosure });
  if (!agreement || agreement.status !== "active") {
    return none("no_active_agreement", "No platform fee applies to this job.");
  }
  const key = RULE_KEYS[jobSource];
  const applies = Array.isArray(agreement.applies_to_sources) ? agreement.applies_to_sources : [];
  if (!key || !applies.includes(key) || agreement.fee_model === "none") {
    return none("source_not_covered", "No platform fee applies to this job under your agreement.");
  }
  if (agreement.fee_model === "percentage") {
    const pct = Math.min(100, Math.max(0, Number(agreement.fee_percent) || 0));
    return { fee: round2((jobValue * pct) / 100), rule: `percentage_${pct}`, disclosure: `${pct}% platform fee on the final invoice, per your agreement.` };
  }
  if (agreement.fee_model === "fixed") {
    const fixed = Math.max(0, Number(agreement.fee_fixed_amount) || 0);
    return { fee: round2(fixed), rule: `fixed_${fixed}`, disclosure: `Fixed $${fixed.toFixed(2)} platform fee on this job, per your agreement.` };
  }
  return none("unknown_model", "No platform fee applies to this job.");
}