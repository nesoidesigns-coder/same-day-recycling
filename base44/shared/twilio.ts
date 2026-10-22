import { secrets } from 'base44:runtime';

// Optional Twilio SMS layer for Recycling OS.
//   - SMS is OFF unless the admin turns it on from the dashboard (SmsSettings).
//   - With no provider configured, outbound texts are QUEUED, never claimed sent.
//   - The business contact number (604 Chatr line) is untouched: this layer
//     never changes, ports, purchases or provisions any phone number.
//   - Twilio credentials come from the Secrets page (Account SID + Auth Token);
//     the sending number is admin-configured (SmsSettings.from_number, or the
//     optional TWILIO_FROM_NUMBER secret).

export function twilioConfig() {
  const account_sid = secrets.get('TWILIO_ACCOUNT_SID') || '';
  const auth_token = secrets.get('TWILIO_AUTH_TOKEN') || '';
  const secret_from = secrets.get('TWILIO_FROM_NUMBER') || '';
  return { account_sid, auth_token, secret_from };
}

// Resolves the effective SMS configuration. The dashboard-managed SmsSettings
// record wins over the TWILIO_FROM_NUMBER secret. Never throws.
export async function getSmsConfig(svc) {
  const base = twilioConfig();
  let settings = null;
  try {
    const page = await svc.entities.SmsSettings.filter({}, { limit: 1 });
    settings = ((page && page.items) || [])[0] || null;
  } catch {
    // Settings entity unavailable — fall back to secrets only.
  }
  const hasProviderCreds = !!(base.account_sid && base.auth_token);
  const provider = settings && settings.provider ? String(settings.provider) : (hasProviderCreds ? 'twilio' : 'off');
  const from_number = String((settings && settings.from_number) || '').trim() || base.secret_from;
  const outbound_enabled = !(settings && settings.outbound_enabled === false);
  const enabled = provider !== 'off' && outbound_enabled;
  const ready = !!(enabled && base.account_sid && base.auth_token && from_number);
  return {
    ...base,
    settings,
    provider,
    from_number,
    outbound_enabled,
    enabled,
    ready,
    verified: !!(settings && settings.verified),
    from_number_source: String((settings && settings.from_number) || '').trim() ? 'dashboard' : (base.secret_from ? 'secret' : 'none'),
  };
}

export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length >= 8 && digits.length <= 15) return '+' + digits;
  return null;
}

// TwiML XML reply for inbound Twilio webhooks. Empty text = no reply sent.
export function twiml(text) {
  const escaped = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response>' +
      (escaped ? '<Message><Body>' + escaped + '</Body></Message>' : '') +
      '</Response>',
    { headers: { 'Content-Type': 'text/xml; charset=utf-8' } },
  );
}

// Validates Twilio's request signature: HMAC-SHA1 over the full request URL
// plus all POST params sorted alphabetically, base64-encoded with the auth token.
export async function validateTwilioSignature(authToken, url, params, signature) {
  if (!authToken || !signature || !url) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
  const expected = btoa(String.fromCharCode(...mac));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

// Low-level delivery through the Twilio REST API. Throws on non-2xx —
// the caller decides what "sent" means (only provider-confirmed acceptance
// is ever recorded as sent).
async function deliverSms(cfg, to, text) {
  const params = new URLSearchParams({ To: to, From: cfg.from_number, Body: text });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${cfg.account_sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(cfg.account_sid + ':' + cfg.auth_token),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Twilio error ' + res.status);
  return { ok: true, sid: data.sid || '' };
}

// Sends one SMS and logs it to SmsMessage. Never throws. When the provider is
// off or no verified sending number is set, the message is QUEUED (status
// 'queued') and {ok:false, queued:true} is returned — callers must never
// report it as sent.
export async function sendSms(svc, { to, body, booking_id = '', partner_id = '', role = 'system' }) {
  const e164 = normalizePhone(to);
  const text = String(body || '').trim().slice(0, 1600);
  if (!e164) return { ok: false, error: 'Invalid phone number: ' + to };
  if (!text) return { ok: false, error: 'Empty message body' };

  const cfg = await getSmsConfig(svc);

  let record = null;
  try {
    record = await svc.entities.SmsMessage.create({
      direction: 'outbound',
      role,
      phone: e164,
      body: text,
      booking_id: String(booking_id || ''),
      partner_id: String(partner_id || ''),
      status: cfg.ready ? 'sent' : 'queued',
    });
  } catch {
    // Logging is best-effort; the send itself still proceeds.
  }

  if (!cfg.ready) {
    const reason = cfg.provider === 'off'
      ? 'SMS provider is off — message queued.'
      : 'No verified sending number configured — message queued.';
    if (record) {
      await svc.entities.SmsMessage.update(record.id, { error: reason }).catch(() => {});
    }
    return { ok: false, queued: true, error: reason };
  }

  try {
    const sent = await deliverSms(cfg, e164, text);
    if (record && sent.sid) {
      await svc.entities.SmsMessage.update(record.id, { twilio_sid: sent.sid }).catch(() => {});
    }
    return { ok: true, sid: sent.sid, to: e164 };
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 500);
    if (record) {
      await svc.entities.SmsMessage.update(record.id, { status: 'failed', error: msg }).catch(() => {});
    }
    return { ok: false, error: msg };
  }
}

// Admin action: send everything currently queued, oldest first. Only runs
// when the provider is configured and ready; otherwise reports that nothing
// can send yet.
export async function flushSmsQueue(svc, limit = 50) {
  const cfg = await getSmsConfig(svc);
  if (!cfg.ready) {
    return { ok: false, error: 'SMS is not configured yet — nothing can send.', sent: 0, failed: 0 };
  }
  const page = await svc.entities.SmsMessage.filter(
    { direction: 'outbound', status: 'queued' },
    { sort: 'created_date', limit },
  );
  const queued = (page && page.items) || [];
  let sent = 0;
  let failed = 0;
  for (const m of queued) {
    try {
      const r = await deliverSms(cfg, m.phone, String(m.body || '').slice(0, 1600));
      await svc.entities.SmsMessage.update(m.id, { status: 'sent', twilio_sid: r.sid, error: '' });
      sent += 1;
    } catch (e) {
      await svc.entities.SmsMessage.update(m.id, { status: 'failed', error: String((e && e.message) || e).slice(0, 500) });
      failed += 1;
    }
  }
  return { ok: true, sent, failed, attempted: queued.length };
}