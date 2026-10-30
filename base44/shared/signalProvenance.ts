/**
 * Signal provenance contract (Stage 1).
 * Definition and validation only: no ingestion, queries, or dashboards use this yet.
 * Never infer unknown geography or authorship from an authenticated session ID.
 */
export const PURPOSES = [
  'customer_request', 'estimate', 'search_interest',
  'observed_public_request', 'market_indicator', 'confirmed_booking',
  'internal_task', 'engineering_note',
] as const;
export type Purpose = (typeof PURPOSES)[number];

export const ACTORS = ['customer', 'contractor', 'admin', 'rex', 'system'] as const;
export type Actor = (typeof ACTORS)[number];

export const GEO_CONFIDENCES = ['verified', 'inferred', 'unknown', 'not_applicable'] as const;
export type GeoConfidence = (typeof GEO_CONFIDENCES)[number];

export interface Geography {
  country: string; // ISO 3166-1 alpha-2 or explicitly 'unknown'
  province_code: string; // '' when not applicable
  city: string; // '' when not applicable; never 'Nationwide'
  geo_confidence: GeoConfidence;
}

export interface SignalProvenance {
  purpose: Purpose;
  actor: Actor;
  geography: Geography;
  source_platform: string; // Explicit 'unknown' is allowed
  collected_at: string; // ISO-8601 observation timestamp, not insertion time
}

export interface ProvenanceValidation {
  ok: boolean;
  errors: string[];
}

const owns = (obj: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const validInstant = (value: unknown): value is string =>
  nonempty(value) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value));

/** Missing fields are invalid; explicitly unknown values are preserved. */
export function validateProvenance(input: unknown): ProvenanceValidation {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ['provenance object is required'] };

  if (!owns(input, 'purpose')) errors.push('purpose is required');
  else if (!PURPOSES.some(p => p === input.purpose))
    errors.push('purpose must be a supported purpose');

  if (!owns(input, 'actor')) errors.push('actor is required');
  else if (!ACTORS.some(a => a === input.actor))
    errors.push('actor must be a supported actor');

  if (!owns(input, 'geography') || !isObject(input.geography)) {
    errors.push('geography object is required');
  } else {
    const g = input.geography;
    if (!owns(g, 'country') || !nonempty(g.country))
      errors.push('geography.country is required (use "unknown")');
    else if (g.country !== 'unknown' && !/^[A-Z]{2}$/.test(g.country))
      errors.push('geography.country must be an uppercase ISO alpha-2 code or "unknown"');

    if (!owns(g, 'province_code') || typeof g.province_code !== 'string')
      errors.push('geography.province_code is required (use "" when not applicable)');
    if (!owns(g, 'city') || typeof g.city !== 'string')
      errors.push('geography.city is required (use "" when not applicable)');
    else if (g.city.trim().toLowerCase() === 'nationwide')
      errors.push('geography.city must not be "Nationwide"');

    if (!GEO_CONFIDENCES.some(c => c === g.geo_confidence))
      errors.push('geography.geo_confidence is invalid');
    if (g.country === 'unknown' && g.geo_confidence !== 'unknown')
      errors.push('unknown country requires unknown geo_confidence');
  }

  if (!owns(input, 'source_platform') || !nonempty(input.source_platform))
    errors.push('source_platform is required (use "unknown")');

  if (!owns(input, 'collected_at') || !validInstant(input.collected_at))
    errors.push('collected_at must be an ISO-8601 timestamp with timezone');

  return { ok: errors.length === 0, errors };
}
