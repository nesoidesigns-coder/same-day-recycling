import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  respondToOffer, runEscalation, adminAssign, adminReassign, offerWave, toItems,
} from '../../shared/dispatchEngine.ts';

// Hybrid intelligent dispatch — callable endpoints.
//   respond      (contractor) accept or decline a lead offer
//   offers       (contractor) list my open offers
//   escalate     (admin/workflow) expire stale offers and offer the next wave
//   admin_assign (admin) manually assign a request to a partner
//   admin_reassign (admin) manually move a booking to another partner
//   admin_match  (admin) run one matching wave for a request now
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Please sign in.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || '';
    const srole = base44.asServiceRole;

    if (action === 'respond') {
      // TEMPORARY TEST HOOK (admin-only): lets the builder exercise the
      // contractor accept/decline path for a partner by email. Remove after QA.
      const effectiveUser = (user.role === 'admin' && body.test_as_email)
        ? { email: String(body.test_as_email) }
        : user;
      const result = await respondToOffer(srole, {
        user: effectiveUser,
        offerId: String(body.offer_id || ''),
        response: body.response === 'decline' ? 'decline' : 'accept',
      });
      return Response.json(result, { status: result.error ? (result.status || 400) : 200 });
    }

    if (action === 'offers') {
      const page = await srole.entities.LeadOffer.filter(
        { partner_email: user.email, status: 'offered' },
        { sort: '-created_date', limit: 25 },
      );
      // Expired-on-read: an offer past its window is shown as expired even
      // before the escalation sweep runs. The request's job details and the
      // contractor's payout ride along so the dashboard can show them.
      const now = new Date().toISOString();
      const raw = toItems(page);
      const requestIds = [...new Set(raw.map((o) => o.request_id))];
      const requests = requestIds.length
        ? await srole.entities.NationalRequest.filter({ id: { $in: requestIds } }, { limit: 50 })
        : [];
      const reqById = Object.fromEntries(toItems(requests).map((r) => [r.id, r]));
      const items = raw.map((o) => {
        const r = reqById[o.request_id] || {};
        const value = Number(r.quote_amount) || 0;
        return {
          ...o,
          is_expired: !!(o.expires_at && o.expires_at < now),
          items_description: r.items_description || '',
          preferred_date: r.preferred_date || '',
          quote_amount: value,
          subscriberPriority: String(o.notes || '').includes('Priority offer'),
        };
      });
      return Response.json({ offers: items });
    }

    if (action === 'escalate') {
      if (user.role !== 'admin') return Response.json({ error: 'Admins only.' }, { status: 403 });
      const result = await runEscalation(srole);
      return Response.json(result);
    }

    if (action === 'admin_match') {
      if (user.role !== 'admin') return Response.json({ error: 'Admins only.' }, { status: 403 });
      const requestId = String(body.request_id || '');
      const request = await srole.entities.NationalRequest.get(requestId);
      if (!request) return Response.json({ error: 'Request not found.' }, { status: 404 });
      if (['confirmed', 'completed', 'cancelled'].includes(request.status)) {
        return Response.json({ error: 'This request is already resolved.' }, { status: 409 });
      }
      const prior = await srole.entities.LeadOffer.filter({ request_id: requestId }, { limit: 500 });
      const priorItems = toItems(prior);
      const round = Math.max(1, ...priorItems.map((o) => Number(o.round) || 1)) + (priorItems.length ? 1 : 0) || 1;
      const exclude = [...new Set(priorItems.filter((o) => ['offered', 'accepted'].includes(o.status)).map((o) => o.partner_id))];
      const offers = await offerWave(srole, request, { round, exclude, createdBy: 'admin' });
      return Response.json({ ok: true, offered: offers.length, to: offers.map((o) => o.partner_name) });
    }

    if (action === 'admin_assign') {
      if (user.role !== 'admin') return Response.json({ error: 'Admins only.' }, { status: 403 });
      const result = await adminAssign(srole, {
        requestId: String(body.request_id || ''),
        partnerId: String(body.partner_id || ''),
        adminName: user.full_name || 'Admin',
      });
      return Response.json(result, { status: result.error ? (result.status || 400) : 200 });
    }

    if (action === 'admin_reassign') {
      if (user.role !== 'admin') return Response.json({ error: 'Admins only.' }, { status: 403 });
      const result = await adminReassign(srole, {
        bookingId: String(body.booking_id || ''),
        newPartnerId: String(body.new_partner_id || ''),
        adminName: user.full_name || 'Admin',
      });
      return Response.json(result, { status: result.error ? (result.status || 400) : 200 });
    }

    return Response.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}