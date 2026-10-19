import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getFacebookPage } from '../../shared/facebook.ts';

const GRAPH = 'https://graph.facebook.com/v25.0';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const conversationId = String(body.conversation_id || '').trim();
    const text = String(body.message_text || '').trim().slice(0, 2000);
    if (!conversationId || !text) {
      return Response.json({ error: 'conversation_id and message_text are required' }, { status: 400 });
    }

    const { pageId, pageToken } = await getFacebookPage(base44);

    // Find the customer's page-scoped id among the conversation participants.
    const convRes = await fetch(`${GRAPH}/${conversationId}?fields=participants`, {
      headers: { Authorization: `Bearer ${pageToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const conv = await convRes.json();
    if (conv.error) {
      return Response.json({ error: conv.error.message || 'Conversation not found on the connected page' }, { status: 404 });
    }
    const participants = (conv.participants && conv.participants.data) || [];
    const customer = participants.find((p) => p && p.id && String(p.id) !== String(pageId));
    if (!customer) {
      return Response.json({ error: 'No customer participant found on that conversation' }, { status: 404 });
    }

    const sendUrl = `${GRAPH}/${pageId}/messages?recipient=${encodeURIComponent(JSON.stringify({ id: customer.id }))}&messaging_type=RESPONSE&message=${encodeURIComponent(JSON.stringify({ text }))}`;
    const sendRes = await fetch(sendUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${pageToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const sendData = await sendRes.json();
    if (sendData.error) {
      return Response.json({ error: sendData.error.message || 'Facebook send failed (replies must be within 24h of the customer last messaging the page)' }, { status: 502 });
    }

    await base44.asServiceRole.entities.FacebookMessageLog.create({
      conversation_id: conversationId,
      message_id: sendData.message_id || `outbound_${Date.now()}`,
      sender_name: 'Same Day Recycling (assistant)',
      message_text: '(outbound reply sent from the admin chat)',
      reply_text: text,
    });

    return Response.json({ ok: true, message_id: sendData.message_id || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}