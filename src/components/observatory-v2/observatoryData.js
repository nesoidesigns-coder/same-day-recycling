import { base44 } from '@/api/base44Client';

export const GEOGRAPHY_URL = 'https://base44.app/api/apps/6ac93990cde830898b8dbc65/files/mp/public/6ac93990cde830898b8dbc65/6588cfa09_canadian-observatory-boundaries.json';
export const SERVICES = [
  ['', 'All services'], ['furniture_appliance_removal', 'Furniture & appliances'],
  ['moving_downsizing', 'Moving & downsizing'], ['renovation_construction_debris', 'Renovation debris'],
  ['property_management_turnover', 'Property & estate cleanouts'], ['recycling_specialty_disposal', 'Recycling & specialty disposal'],
  ['commercial_office_cleanouts', 'Commercial cleanouts'], ['urgent_same_day', 'Urgent pickup'], ['donation_reuse_circular', 'Donation & reuse'],
];
export const SIGNAL_TYPES = [
  ['observed_public_request', 'Public request posts'], ['platform_inquiry', 'Website inquiries'],
  ['confirmed_booking', 'Confirmed bookings'], ['qualified_opportunity', 'Qualified opportunities'],
  ['search_interest', 'Search-interest records'], ['market_indicator', 'Market context records'],
];
export const STATUS = {
  same_day: ['Verified provider serves this city', 'Job acceptance and time window still required.'],
  matching: ['Provider matching required', 'An open request is being matched; no provider confirmed.'],
  recruiting: ['Provider recruitment', 'Requests are open; a local provider is not yet verified.'],
  currently_unavailable: ['No current availability confirmed', 'You can request service; fulfillment is not guaranteed.'],
};
export const keyOf = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const money = (n) => Number.isFinite(n) ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n) : 'Not available';
export const timestamp = (value) => value ? new Date(value).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not reported';
export async function invoke(name, params) {
  const { data } = await base44.functions.invoke(name, params);
  if (data?.error) throw new Error(data.error);
  return data;
}
export function project(lng, lat) {
  const r = Math.PI / 180, n = Math.sin(55 * r);
  const f = Math.cos(55 * r) * Math.pow(Math.tan(Math.PI / 4 + 55 * r / 2), n) / n;
  const rho = f / Math.pow(Math.tan(Math.PI / 4 + lat * r / 2), n);
  const origin = f / Math.pow(Math.tan(Math.PI / 4 + 60 * r / 2), n), theta = n * (lng + 96) * r;
  return { x: 510 + rho * Math.sin(theta) * 650, y: 300 + (rho * Math.cos(theta) - origin) * 650 };
}
export const MAJOR_CITIES = ['Vancouver', 'Calgary', 'Edmonton', 'Winnipeg', 'Toronto', 'Ottawa', 'Montreal', 'Halifax', "St. John's", 'Whitehorse', 'Yellowknife', 'Iqaluit'];
export function periodTrend(data) {
  const now = new Date(), complete = (data?.trend || []).filter(r => r.month < now.toISOString().slice(0, 7));
  const prev = complete.at(-2), last = complete.at(-1);
  if (!prev || !last) return null;
  const adjacent = new Date(`${last.month}-01`) - new Date(`${prev.month}-01`) < 32 * 86400000;
  if (!adjacent) return null;
  return { prev, last };
}