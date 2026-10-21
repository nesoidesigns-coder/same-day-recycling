import { secrets } from 'base44:runtime';

export const CURRENCY = 'CAD';
let accessCache = null;

export function paypalApiBase() {
  const mode = (secrets.get('PAYPAL_MODE') || 'sandbox').toLowerCase();
  return mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

export async function paypalAccessToken() {
  const now = Date.now();
  if (accessCache && accessCache.expires > now + 60000) return accessCache.token;
  const clientId = secrets.get('PAYPAL_CLIENT_ID');
  const clientSecret = secrets.get('PAYPAL_SECRET');
  if (!clientId || !clientSecret) throw new Error('PayPal credentials are not set in app secrets.');
  const res = await fetch(paypalApiBase() + '/v1/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || 'PayPal authentication failed.');
  accessCache = { token: data.access_token, expires: now + ((data.expires_in || 300) - 60) * 1000 };
  return data.access_token;
}

export async function paypal(path, method = 'GET', body = undefined) {
  const access = await paypalAccessToken();
  const res = await fetch(paypalApiBase() + path, {
    method,
    headers: { Authorization: 'Bearer ' + access, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data.details && data.details[0] && data.details[0].description) || data.message || ('PayPal API error ' + res.status);
    throw new Error(detail);
  }
  return data;
}

export function paypalAppOrigin(req) {
  const host = req.headers.get('x-base44-app-url');
  if (host) return ('https://' + host).replace(/\/$/, '');
  return new URL(req.url).origin;
}

// Apply a subscription lifecycle state to the owning license or white-label record.
// state: 'active' | 'paused' | 'cancelled'. Idempotent — no-ops when already in the target state.
export async function applySubscriptionState(srole, purpose, refId, state) {
  if (!refId) return;
  const today = new Date().toISOString().slice(0, 10);
  if (purpose === 'license_subscription') {
    const lic = await srole.entities.SoftwareLicense.get(refId).catch(() => null);
    if (!lic || !lic.id) return;
    if (state === 'cancelled') {
      if (lic.status !== 'cancelled') {
        await srole.entities.SoftwareLicense.update(lic.id, { status: 'cancelled' });
      }
      return;
    }
    if (state === 'paused') {
      if (['active', 'setup_paid'].includes(lic.status)) {
        await srole.entities.SoftwareLicense.update(lic.id, { status: 'paused' });
      }
      return;
    }
    if (lic.status === 'cancelled') return;
    await srole.entities.SoftwareLicense.update(lic.id, {
      status: 'active',
      started_date: lic.started_date || today,
      provisioned_date: lic.provisioned_date || today,
    });
    if (!lic.provisioned_date) {
      try {
        await srole.users.inviteUser(lic.email, 'user');
      } catch (e) {
        await srole.entities.SoftwareLicense.update(lic.id, { notes: ('Account invite: ' + (e.message || 'failed')).slice(0, 1000) });
      }
    }
  } else {
    const map = { active: 'active', paused: 'paused', cancelled: 'churned' };
    await srole.entities.WhiteLabelClient.update(refId, { status: map[state] }).catch(() => {});
  }
}

export function parseQuoteAmount(text) {
  const m = String(text || '').replace(/,/g, '').match(/\$\s?(\d+(?:\.\d{1,2})?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return n >= 25 && n <= 100000 ? Math.round(n * 100) / 100 : 0;
}