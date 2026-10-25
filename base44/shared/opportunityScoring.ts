// Explainable opportunity scoring. Deterministic, configurable weights, and a
// written explanation per signal. Speculative demand (search interest) can
// score for marketing relevance but is never eligible for customer outreach.

export interface ScoreInput {
  market_categories: string[];
  service_category?: string;
  geo_confidence: 'exact_city' | 'metro' | 'province' | 'unresolved';
  source_reliability: 'internal_record' | 'verified_source' | 'public_source' | 'aggregate_data';
  demand_type: string;
  published_at?: string | null; // source publication/reporting timestamp
  commercial_intent: 'high' | 'medium' | 'low' | 'none';
  urgency: 'immediate' | 'soon' | 'flexible' | 'none';
  coverage_status: 'covered' | 'province_near' | 'uncovered' | 'unknown';
  related_count?: number;
}

export type Weights = Record<
  'relevance' | 'evidence' | 'geo_confidence' | 'recency' | 'intent' | 'urgency' | 'capacity',
  number
>;

export const DEFAULT_WEIGHTS: Weights = {
  relevance: 20,
  evidence: 15,
  geo_confidence: 15,
  recency: 15,
  intent: 15,
  urgency: 10,
  capacity: 10,
};

export interface ScoreFactor { factor: string; raw: number; weight: number; weighted: number; note: string; }
export interface ScoreResult { score: number; factors: ScoreFactor[]; explanation: string; duplicate_penalty: number; }

function recencyRaw(publishedAt?: string | null): { raw: number; note: string } {
  if (!publishedAt || !Number.isFinite(new Date(publishedAt).getTime())) return { raw: 0.2, note: 'no source timestamp' };
  const days = (Date.now() - new Date(publishedAt).getTime()) / 86400000;
  if (days <= 7) return { raw: 1, note: `${Math.round(days)}d old` };
  if (days <= 14) return { raw: 0.8, note: `${Math.round(days)}d old` };
  if (days <= 30) return { raw: 0.5, note: `${Math.round(days)}d old` };
  if (days <= 60) return { raw: 0.2, note: `${Math.round(days)}d old` };
  return { raw: 0, note: 'stale' };
}

export function scoreSignal(input: ScoreInput, weights: Weights = DEFAULT_WEIGHTS): ScoreResult {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const factors: ScoreFactor[] = [];
  const add = (factor: string, raw: number, weight: number, note: string) =>
    factors.push({ factor, raw: Math.round(raw * 100) / 100, weight, weighted: Math.round(raw * weight * 100) / 100, note });

  // Relevance to offered services: recognized market categories.
  const catCount = (input.market_categories || []).length;
  const relevanceRaw = catCount >= 2 ? 1 : catCount === 1 ? 0.85 : 0.2;
  add('relevance', relevanceRaw, w.relevance, catCount ? `${catCount} market(s) recognized` : 'no market recognized');

  // Evidence strength: how trustworthy the source record is.
  const evidenceRaw = { internal_record: 1, verified_source: 1, public_source: 0.8, aggregate_data: 0.5 }[input.source_reliability] ?? 0.5;
  add('evidence', evidenceRaw, w.evidence, input.source_reliability);

  // Geographic confidence.
  const geoRaw = { exact_city: 1, metro: 0.8, province: 0.5, unresolved: 0 }[input.geo_confidence] ?? 0;
  add('geo_confidence', geoRaw, w.geo_confidence, input.geo_confidence);

  // Recency of the underlying evidence (never the collection time).
  const { raw: recRaw, note: recNote } = recencyRaw(input.published_at);
  add('recency', recRaw, w.recency, recNote);

  // Expressed commercial intent.
  const intentRaw = { high: 1, medium: 0.6, low: 0.3, none: 0 }[input.commercial_intent] ?? 0;
  add('intent', intentRaw, w.intent, input.commercial_intent);

  // Urgency.
  const urgencyRaw = { immediate: 1, soon: 0.7, flexible: 0.4, none: 0 }[input.urgency] ?? 0;
  add('urgency', urgencyRaw, w.urgency, input.urgency);

  // Verified contractor fulfillment capacity at the location.
  const capRaw = { covered: 1, province_near: 0.5, uncovered: 0.2, unknown: 0.4 }[input.coverage_status] ?? 0.4;
  add('capacity', capRaw, w.capacity, input.coverage_status);

  const duplicatePenalty = (input.related_count || 0) > 1 ? 10 : 0;
  if (duplicatePenalty) add('duplicate_penalty', -1, duplicatePenalty, `${input.related_count} related signals in window`);

  const totalWeight = Object.values(w).reduce((a, b) => a + b, 0);
  const score = Math.max(0, Math.min(100, Math.round((factors.reduce((a, f) => a + f.weighted, 0) / totalWeight) * 100)));
  const explanation = factors
    .map((f) => `${f.factor.replace(/_/g, ' ')}: ${f.note} (+${f.weighted})`)
    .join('; ');
  return { score, factors, explanation, duplicate_penalty: duplicatePenalty };
}