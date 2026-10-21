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
  // Header may carry a protocol (or a mangled one) — normalize to exactly one https://.
  let host = (req.headers.get('x-base44-app-url') || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!host) {
    try { host = new URL(req.url).origin.replace(/^https?:\/\//i, ''); } catch { host = ''; }
  }
  return host ? 'https://' + host : '';
}

// Apply a subscription lifecycle state to the owning license or white-label record.
// state: 'active' | 'paused' | 'cancelled'. Idempotent — no-ops when already in the target state.
// client: optional full client (from createClientFromRequest) used for account invites,
// since the service-role client does not expose the users module.
export async function applySubscriptionState(srole, purpose, refId, state, client = null) {
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
        let invited = false;
        const inviter = (client && client.users) || srole.users;
        if (inviter && typeof inviter.inviteUser === 'function') {
          await inviter.inviteUser(lic.email, 'user');
          invited = true;
        } else if (client && client.fetchWithAuth && client.getConfig) {
          // Some runtimes omit the users module; call the invite endpoint with
          // the service-role credentials fetchWithAuth forwards.
          const cfg = client.getConfig();
          const res = await client.fetchWithAuth('/api/apps/' + cfg.appId + '/runtime/users/invite-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_email: lic.email, role: 'user' }),
          });
          if (!res.ok) throw new Error('Invite endpoint returned ' + res.status);
          invited = true;
        }
        if (!invited) throw new Error('No invite mechanism available.');
        await srole.entities.SoftwareLicense.update(lic.id, { notes: 'Account invite sent.' });
      } catch (e) {
        await srole.entities.SoftwareLicense.update(lic.id, { notes: ('Account invite: ' + (e.message || 'failed')).slice(0, 1000) });
      }
    }
  } else {
    const map = { active: 'active', paused: 'paused', cancelled: 'churned' };
    await srole.entities.WhiteLabelClient.update(refId, { status: map[state] }).catch(() => {});
  }
}

// Retry a failed account invite for an already-active license subscription.
// Returns the license's post-invite state for callers to report.
export async function ensureLicenseInvite(srole, client, tx) {
  if (!tx || tx.purpose !== 'license_subscription' || !tx.ref_id) return null;
  const lic = await srole.entities.SoftwareLicense.get(tx.ref_id).catch(() => null);
  if (!lic || !lic.id || lic.provisioned_date) return null;
  await applySubscriptionState(srole, tx.purpose, tx.ref_id, 'active', client);
  const after = await srole.entities.SoftwareLicense.get(tx.ref_id).catch(() => null);
  return after && after.id ? { provisioned: !!after.provisioned_date, notes: after.notes } : null;
}

export function parseQuoteAmount(text) {
  const m = String(text || '').replace(/,/g, '').match(/\$\s?(\d+(?:\.\d{1,2})?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return n >= 25 && n <= 100000 ? Math.round(n * 100) / 100 : 0;
}