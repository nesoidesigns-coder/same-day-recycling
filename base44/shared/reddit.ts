// Shared Reddit OAuth access for Recycling OS: read-only public discovery and
// approval-gated publishing. Official API endpoints only; credentials come
// exclusively from server secrets and are never returned to callers or logged.
import { secrets } from 'base44:runtime';

export const REDDIT_UA = 'RecyclingOS-Community-Discovery/1.0 (public service-request discovery; samedayrecycling.ca)';

function readSecret(name) {
  try {
    return secrets.get(name) || '';
  } catch {
    return '';
  }
}

export function redditConfig() {
  const clientId = readSecret('REDDIT_CLIENT_ID');
  const clientSecret = readSecret('REDDIT_CLIENT_SECRET');
  const username = readSecret('REDDIT_USERNAME');
  const password = readSecret('REDDIT_PASSWORD');
  return {
    clientId,
    clientSecret,
    username,
    password,
    hasRead: Boolean(clientId && clientSecret),
    hasPublish: Boolean(clientId && clientSecret && username && password),
  };
}

async function tokenRequest(body) {
  const c = redditConfig();
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${c.clientId}:${c.clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': REDDIT_UA,
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Reddit token endpoint returned ${res.status}`);
  const data = await res.json();
  if (!data.access_token) throw new Error('Reddit did not return an access token');
  return data.access_token;
}

// Read-only app token (client credentials grant).
export async function appToken() {
  if (!redditConfig().hasRead) return { token: null, error: 'credentials_missing' };
  try {
    return { token: await tokenRequest('grant_type=client_credentials'), error: '' };
  } catch (e) {
    return { token: null, error: e?.message || 'token request failed' };
  }
}

// User token (password grant) — used ONLY to publish posts the owner approved.
export async function userToken() {
  const c = redditConfig();
  if (!c.hasPublish) return { token: null, error: 'publish_credentials_missing' };
  try {
    const body = `grant_type=password&username=${encodeURIComponent(c.username)}&password=${encodeURIComponent(c.password)}`;
    return { token: await tokenRequest(body), error: '' };
  } catch (e) {
    return { token: null, error: e?.message || 'token request failed' };
  }
}

export async function redditGet(token, path) {
  const res = await fetch(`https://oauth.reddit.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': REDDIT_UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Reddit API returned ${res.status}`);
  return res.json();
}

// A community's public rules, so drafts can be tailored and compliance checked.
export async function subredditRules(token, sub) {
  try {
    const data = await redditGet(token, `/r/${sub}/about/rules`);
    const rules = (data.rules || []).map((r) => ({ name: String(r.short_name || '').slice(0, 120), text: String(r.description || '').slice(0, 400) }));
    return { ok: true, rules, error: '' };
  } catch (e) {
    return { ok: false, rules: [], error: e?.message || 'rules request failed' };
  }
}

// Publishes ONE approved self post. Manual, single item, never automated,
// never an unsolicited reply, never a repeated advertisement.
export async function submitSelfPost(token, sub, title, text) {
  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': REDDIT_UA,
    },
    body: new URLSearchParams({ sr: sub, kind: 'self', title: title.slice(0, 300), text: text.slice(0, 6000), api_type: 'json' }).toString(),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error('Reddit rate limit reached. Try again later.');
    throw new Error(`Reddit publish returned ${res.status}`);
  }
  const data = await res.json();
  const errors = data?.json?.errors || [];
  if (errors.length) throw new Error(`Reddit rejected the post: ${JSON.stringify(errors).slice(0, 200)}`);
  const url = data?.json?.data?.url || '';
  if (!url) throw new Error('Reddit did not confirm the post');
  return url;
}

// Connection health snapshot for the admin dashboard.
export async function redditHealth() {
  const c = redditConfig();
  if (!c.hasRead) {
    return {
      status: 'credentials_missing',
      message: 'Reddit app credentials are not set yet. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET on the Secrets page to activate authorized discovery.',
      publishing: c.hasPublish,
      account: '',
    };
  }
  const t = await appToken();
  if (!t.token) return { status: 'error', message: t.error, publishing: c.hasPublish, account: c.username || '' };
  return { status: 'connected', message: '', publishing: c.hasPublish, account: c.username || '' };
}