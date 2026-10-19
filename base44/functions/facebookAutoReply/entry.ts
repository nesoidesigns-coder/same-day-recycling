import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getFacebookPage } from '../../shared/facebook.ts';

const GRAPH = "https://graph.facebook.com/v25.0";

const BUSINESS_BRIEF = `You are the AI receptionist for "Same Day Recycling" replying to Facebook Messenger messages on their page. Business facts: same-day junk, furniture and appliance removal across Metro Vancouver (Vancouver, Burnaby, Surrey, Richmond, Coquitlam, Langley, Abbotsford). Eco-friendly recycling and disposal. Free metal pickup. Pickup starts at $129 and larger loads scale up. $299/month subscription for property managers with up to 4 pickups. Book before noon for same-day service. Phone: (604) 849-1745. Website: samedayrecycling.ca. Reply rules: 1-3 short friendly sentences, warm and helpful, no hype, no em-dashes, no markdown. Answer their question if you can; if they want a firm price or want to book, invite them to call or text (604) 849-1745 or book at samedayrecycling.ca. Never invent prices beyond what is listed above; say "depends on load size, we quote fast" instead.`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;

    const settingsPage = await svc.entities.FacebookSettings.list();
    const settings = (settingsPage.items || [])[0];
    if (settings && settings.auto_reply_enabled === false) {
      return Response.json({ ok: true, skipped: 'auto-reply is turned off' });
    }

    const { pageId, pageToken } = await getFacebookPage(base44);

    const convRes = await fetch(
      `${GRAPH}/${pageId}/conversations?fields=id,updated_time,messages.limit(5){id,from,message,created_time}&limit=15`,
      { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(15000) }
    );
    const convData = await convRes.json();
    if (convData.error) {
      return Response.json({ error: convData.error.message || 'Facebook conversations unavailable' }, { status: 502 });
    }
    const conversations = convData.data || [];

    let replied = 0;
    let skipped = 0;
    let bookingsCaptured = 0;
    const details = [];

    for (const conv of conversations) {
      const msgs = (conv.messages && conv.messages.data) || [];
      const last = msgs[0];
      if (!last || !last.message) { skipped += 1; continue; }
      if (!last.from || String(last.from.id) === String(pageId)) { skipped += 1; continue; }
      const ageMs = Date.now() - new Date(last.created_time).getTime();
      if (ageMs > 20 * 3600 * 1000) { skipped += 1; continue; }
      const existing = await svc.entities.FacebookMessageLog.filter({ message_id: last.id });
      if (existing.items && existing.items.length) { skipped += 1; continue; }

      // Newest-first messages -> oldest-first transcript for the LLM
      const history = [...msgs].reverse()
        .map((m) => `${String((m.from && m.from.id) === String(pageId) ? 'Business' : 'Customer')}: ${m.message || ''}`)
        .join('\n')
        .slice(0, 2000);

      const llm = await svc.integrations.Core.InvokeLLM({
        prompt: `${BUSINESS_BRIEF}\n\nConversation so far (oldest first):\n${history}\n\nThe customer's latest message is: "${String(last.message).slice(0, 1000)}"\n\nLEAD CAPTURE: If the customer wants to book a pickup, set wants_booking to true and extract any details they gave: name, phone, address, city, items. If their phone number is still unknown, ask for it (and their address) in your reply so you can lock in the booking. If you already have their phone, city and items, write the reply as a friendly confirmation that their pickup request is in and dispatch will call to confirm the window and upfront price.\n\nWrite the reply to send now.`,
        response_json_schema: {
          type: 'object',
          properties: {
            reply: { type: 'string' },
            wants_booking: { type: 'boolean' },
            name: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            city: { type: 'string' },
            items: { type: 'string' },
          },
          required: ['reply'],
        },
      });
      const replyText = String(llm.reply || '').trim().slice(0, 2000);
      if (!replyText) { skipped += 1; continue; }

      // Capture the booking when we have enough to book: a phone plus what needs to go
      let bookingCaptured = false;
      if (llm.wants_booking && llm.phone && (llm.items || llm.address || llm.city)) {
        const prior = await svc.entities.FacebookMessageLog.filter({ conversation_id: conv.id, lead_captured: true });
        if (!prior.items || prior.items.length === 0) {
          await svc.entities.Booking.create({
            name: (llm.name && String(llm.name).trim()) || (last.from && last.from.name) || 'Facebook Messenger lead',
            phone: String(llm.phone).slice(0, 30),
            address: String(llm.address || llm.city || 'To confirm by phone').slice(0, 200),
            city: String(llm.city || '').slice(0, 100),
            items_description: String(llm.items || 'Messenger inquiry, details to confirm').slice(0, 1000),
            description: 'Captured automatically by the Facebook AI receptionist from Messenger.',
          });
          bookingCaptured = true;
          bookingsCaptured += 1;
        }
      }

      const sendUrl = `${GRAPH}/${pageId}/messages?recipient=${encodeURIComponent(JSON.stringify({ id: last.from.id }))}&messaging_type=RESPONSE&message=${encodeURIComponent(JSON.stringify({ text: replyText }))}`;
      const sendRes = await fetch(sendUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageToken}` },
        signal: AbortSignal.timeout(10000),
      });
      const sendData = await sendRes.json();

      await svc.entities.FacebookMessageLog.create({
        conversation_id: conv.id,
        message_id: last.id,
        sender_name: (last.from && last.from.name) || 'Facebook user',
        message_text: last.message,
        reply_text: sendData.error ? '' : replyText,
        error: sendData.error ? (sendData.error.message || 'send failed') : '',
        lead_captured: bookingCaptured,
      });
      if (!sendData.error) {
        replied += 1;
        details.push({ sender: (last.from && last.from.name) || '', reply: replyText, booking_captured: bookingCaptured });
      }
    }

    return Response.json({ ok: true, conversations_checked: conversations.length, replied, skipped, bookings_captured: bookingsCaptured });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}