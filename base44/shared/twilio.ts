import { secrets } from 'base44:runtime';

// Twilio SMS layer for Recycling OS: outbound sends (logged to SmsMessage),
// inbound webhook signature validation and TwiML responses.
// Secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.

export function twilioConfig() {
  const account_sid = secrets.get('TWILIO_ACCOUNT_SID') || '';
  const auth_token = secrets.get('TWILIO_AUTH_TOKEN') || '';
  const from_number = secrets.get('TWILIO_FROM_NUMBER') || '';
  return { account_sid, auth_token, from_number, ready: Boolean(account_sid && auth_token && from_number) };
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

// Sends one SMS and logs it to SmsMessage. Never throws: failures return
// {ok:false, error} and are recorded on the log record (status 'failed').
export async function sendSms(svc, { to, body, booking_id = '', partner_id = '', role = 'system' }) {
  const e164 = normalizePhone(to);
  const text = String(body || '').trim().slice(0, 1600);
  if (!e164) return { ok: false, error: 'Invalid phone number: ' + to };
  if (!text) return { ok: false, error: 'Empty message body' };

  let record = null;
  try {
    record = await svc.entities.SmsMessage.create({
      direction: 'outbound',
      role,
      phone: e164,
      body: text,
      booking_id: String(booking_id || ''),
      partner_id: String(partner_id || ''),
      status: 'sent',
    });
  } catch {
    // Logging is best-effort; the send itself still proceeds.
  }

  const cfg = twilioConfig();
  if (!cfg.ready) {
    const reason = 'Twilio is not fully configured — check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER on the Secrets page.';
    if (record) {
      await svc.entities.SmsMessage.update(record.id, { status: 'failed', error: reason }).catch(() => {});
    }
    return { ok: false, error: reason };
  }

  try {
    const params = new URLSearchParams({ To: e164, From: cfg.from_number, Body: text });
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
    if (record && data.sid) {
      await svc.entities.SmsMessage.update(record.id, { twilio_sid: data.sid }).catch(() => {});
    }
    return { ok: true, sid: data.sid || '', to: e164 };
  } catch (e) {
    const msg = String((e && e.message) || e).slice(0, 500);
    if (record) {
      await svc.entities.SmsMessage.update(record.id, { status: 'failed', error: msg }).catch(() => {});
    }
    return { ok: false, error: msg };
  }
}