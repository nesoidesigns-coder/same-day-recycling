// Agreement-based fee engine.
// Fees are derived ONLY from the contractor's active agreement and the job's
// applicable fee rules. A customer-source label alone never triggers a fee.

export const JOB_SOURCES = [
  'contractor_generated',
  'platform_generated',
  'personal_referral',
  'repeat_customer',
  'other_referral',
];

// Maps a job source to the agreement rule key it may be charged under.
// contractor_generated and repeat_customer are never charged unless an
// agreement explicitly lists them (the admin must opt in per agreement).
const SOURCE_TO_RULE = {
  platform_generated: 'platform_generated',
  personal_referral: 'personal_referral',
  other_referral: 'other_referral',
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function pickActiveAgreement(agreements, partnerId) {
  return (agreements || []).find(
    (a) => a.partner_id === partnerId && a.status === 'active',
  ) || null;
}

// Returns { fee, rule, disclosure } for a job. fee is 0 when no agreement
// rule applies — never a default percentage.
export function computeFee({ agreement, jobSource, jobValue }) {
  const value = Number(jobValue) || 0;
  if (!agreement || agreement.status !== 'active') {
    return { fee: 0, rule: 'no_active_agreement', disclosure: 'No platform fee applies to this job.' };
  }
  const ruleKey = SOURCE_TO_RULE[jobSource];
  const applies = Array.isArray(agreement.applies_to_sources) ? agreement.applies_to_sources : [];
  if (!ruleKey || !applies.includes(ruleKey) || agreement.fee_model === 'none') {
    return { fee: 0, rule: 'source_not_covered', disclosure: 'No platform fee applies to this job under your agreement.' };
  }
  if (agreement.fee_model === 'percentage') {
    const pct = Math.min(100, Math.max(0, Number(agreement.fee_percent) || 0));
    return {
      fee: round2((value * pct) / 100),
      rule: `percentage_${pct}`,
      disclosure: `${pct}% platform fee on the final invoice, per your agreement.`,
    };
  }
  if (agreement.fee_model === 'fixed') {
    const fixed = Math.max(0, Number(agreement.fee_fixed_amount) || 0);
    return {
      fee: round2(fixed),
      rule: `fixed_${fixed}`,
      disclosure: `Fixed $${fixed.toFixed(2)} platform fee on this job, per your agreement.`,
    };
  }
  return { fee: 0, rule: 'unknown_model', disclosure: 'No platform fee applies to this job.' };
}