import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const REVIEW_URL = 'https://samedayrecycling.ca/review';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendGmail(accessToken, to, subject, html) {
  const mime =
    'To: ' + to + '\r\n' +
    'Subject: ' + subject + '\r\n' +
    'MIME-Version: 1.0\r\n' +
    'Content-Type: text/html; charset="UTF-8"\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    btoa(String.fromCharCode(...new TextEncoder().encode(html)));

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: toBase64Url(mime) }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error('Gmail send failed: ' + res.status + ' ' + detail.slice(0, 200));
  }
  return res.json();
}

function buildEmail(booking) {
  const first = escapeHtml((booking.name || 'there').split(' ')[0]);
  const address = escapeHtml(booking.address);
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0c3b24">' +
    '<h2 style="margin:0 0 12px">Thanks for choosing Same Day Recycling, ' + first + '!</h2>' +
    '<p style="color:#334155;line-height:1.6">Your pickup at <strong>' + address + '</strong> was a few days ago &mdash; we hope everything arrived exactly where it should: recycled, donated or responsibly disposed.</p>' +
    '<p style="color:#334155;line-height:1.6">Would you take 30 seconds to share how we did? Your review helps neighbours in your area find a disposal service they can trust.</p>' +
    '<p style="margin:24px 0"><a href="' + REVIEW_URL + '" style="background:#1d9e56;color:#000;padding:14px 28px;border-radius:16px;font-weight:bold;text-decoration:none">Leave a review</a></p>' +
    '<p style="color:#64748b;font-size:13px">Need anything else picked up? Call or text us anytime: (604) 849-1745.</p>' +
    '<p style="color:#64748b;font-size:13px">&mdash; The Same Day Recycling team</p>' +
    '</div>'
  );
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Bookings whose pickup was 3+ days ago (Vancouver time), not cancelled, with an email on file
    const cutoff = new Date(Date.now() - 3 * 24 * 3600 * 1000)
      .toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const { items: bookings } = await base44.asServiceRole.entities.Booking.filter(
      { preferred_date: { $lte: cutoff }, status: { $ne: 'cancelled' }, review_requested: { $ne: true } },
      { sort: '-created_date', limit: 100 }
    );

    const eligible = bookings.filter((b) => b.preferred_date && b.email);
    if (!eligible.length) {
      return Response.json({ ok: true, sent: 0, skipped: 0 });
    }

    // Don't ask for a review from customers who already left one
    const { items: existingReviews } = await base44.asServiceRole.entities.Review.filter(
      { booking_id: { $in: eligible.map((b) => b.id) } },
      { fields: ['booking_id'] }
    );
    const alreadyReviewed = new Set(existingReviews.map((r) => r.booking_id));

    let sent = 0;
    const errors = [];
    for (const b of eligible) {
      if (alreadyReviewed.has(b.id)) continue;
      try {
        await sendGmail(accessToken, b.email, 'How was your pickup, ' + (b.name || '').split(' ')[0] + '?', buildEmail(b));
        await base44.asServiceRole.entities.Booking.update(b.id, { review_requested: true });
        sent += 1;
      } catch (e) {
        errors.push(b.email + ': ' + e.message);
      }
    }

    return Response.json({ ok: true, sent, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}