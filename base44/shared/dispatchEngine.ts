// Hybrid intelligent dispatch engine — shared server-side core.
//
// Flow (per the operator's rules):
//   1. A customer request arrives (nationalInquiry) and is always accepted.
//   2. The engine scores eligible VERIFIED contractors for the request's city,
//      service type and equipment, then offers the job to the top N with
//      priority for territory subscribers whose agreements provide it.
//   3. A contractor accepts (creates the booking + discloses fee terms) or
//      declines. A declined/expired offer escalates to the next wave.
//   4. If no contractor responds within the configurable window, the offer
//      expires; the next wave is offered. When all candidates are exhausted
//      the administrator is notified — the customer is NEVER promised
//      confirmed same-day service, and the request sits in the matching queue.
//   5. The administrator can manually assign, reassign or intervene at any
//      point; manual actions always win over automated ones.
//
// Every state change is logged on the request's dispatch contact log and on
// the LeadOffer record, so leads, responses, bookings and outcomes are
// fully tracked.

import { computeFee, pickActiveAgreement } from './feeEngine.ts';
import { sendSms } from './twilio.ts';
import { isTestPartner } from './coverageStatus.ts';
import { partnerCoversCity } from './territory.ts';

// entity filter()/list() return a page ({items}) when given options, or a bare array.
export const toItems = (page) => (Array.isArray(page) ? page : (page && page.items) || []);

const normCity = (v) => String(v || '').toLowerCase().replace(/,\s*[a-z.\s]{2,4}$/, '').trim();

const EQUIP_FOR_SERVICE = {
  junk_removal: ['truck'],
  furniture: ['truck'],
  appliances: ['truck', 'appliance'],
  electronics: ['electronics'],
  metal_pickup: ['metal', 'truck'],
  cleanouts: ['trailer', 'bin', 'truck'],
  other: [],
};

const iso = (d = new Date()) => d.toISOString();
const dateOnly = (d = new Date()) => d.toISOString().slice(0, 10);

export async function getSettings(srole) {
  const page = await srole.entities.DispatchSettings.filter({}, { limit: 1 });
  const existing = toItems(page)[0];
  if (existing) return existing;
  return srole.entities.DispatchSettings.create({}); // defaults from the schema
}

async function logContact(srole, request, entry) {
  const log = [...(request.dispatch_contact_log || []), { date: iso(), ...entry }];
  await srole.entities.NationalRequest.update(request.id, { dispatch_contact_log: log });
}

async function bumpDispatchTask(srole, request, patch) {
  if (!request.dispatch_task_id) return;
  try {
    const task = await srole.entities.DispatchTask.get(request.dispatch_task_id);
    if (!task) return;
    const update = { ...patch };
    if (patch.contact_log_entry) {
      update.contact_log = [...(task.contact_log || []), { date: iso(), ...patch.contact_log_entry }];
      delete update.contact_log_entry;
    }
    await srole.entities.DispatchTask.update(task.id, update);
  } catch { /* dispatch task sync is best-effort */ }
}

// ---------------------------------------------------------------------------
// Candidate scoring
// ---------------------------------------------------------------------------

// Eligibility: active + verified partner, EXPLICIT service area covers the
// request city (home city, a confirmed additional municipality, or an
// agreement territory city), equipment fits the job type, and the partner is
// not paused from auto-dispatch (dispatch_mode). Coverage is never inferred
// from proximity.
export async function findCandidates(srole, request) {
  const cityNorm = normCity(request.city);
  const serviceType = request.service_type || 'other';
  const wanted = EQUIP_FOR_SERVICE[serviceType] || [];

  const [partnerPage, agreementPage, leadOfferPage, bookingPage] = await Promise.all([
    srole.entities.Partner.filter({ active: true }, { limit: 500 }),
    srole.entities.ContractorAgreement.filter({ status: 'active' }, { limit: 500 }),
    srole.entities.LeadOffer.filter({ request_id: request.id }, { limit: 500 }),
    srole.entities.Booking.filter(
      { record_type: { $ne: 'internal_test' }, assignment_status: { $in: ['assigned', 'accepted', 'scheduled', 'completed', 'paid', 'declined'] } },
      { limit: 1000 },
    ),
  ]);

  const alreadyOffered = new Set(
    toItems(leadOfferPage)
      .filter((o) => ['offered', 'accepted'].includes(o.status))
      .map((o) => o.partner_id),
  );

  const perf = {};
  for (const b of toItems(bookingPage)) {
    const p = perf[b.partner_id] || (perf[b.partner_id] = { offered: 0, positive: 0, completed: 0 });
    p.offered += 1;
    if (['assigned', 'accepted', 'scheduled', 'completed', 'paid'].includes(b.assignment_status)) p.positive += 1;
    if (['completed', 'paid'].includes(b.assignment_status)) p.completed += 1;
  }

  const agreements = toItems(agreementPage);
  const candidates = [];
  for (const p of toItems(partnerPage)) {
    if (p.active === false || alreadyOffered.has(p.id)) continue;
    if (p.dispatch_mode === 'manual_only') continue; // partner opted out of auto-offers
    if (p.verified === false) continue; // only verified contractors receive offers
    if (isTestPartner(p)) continue; // sandbox/test partners never receive real offers
    const partnerServices = (p.service_types || []).map((s) => String(s));
    if (partnerServices.length > 0 && !partnerServices.includes(serviceType)) continue; // job type
    const agreement = pickActiveAgreement(agreements, p.id);
    const territoryCities = ((agreement?.territory_subscription?.territory_cities) || []).map(normCity);
    const inTerritory = territoryCities.includes(cityNorm);
    const coversCity = partnerCoversCity(p, request.city) || inTerritory;
    if (!coversCity) continue; // service area — explicit confirmed territories only

    const equipment = (p.equipment || []).map((e) => String(e).toLowerCase());
    const equipmentOk = wanted.length === 0 || equipment.length === 0
      || wanted.some((w) => equipment.some((e) => e.includes(w)));
    if (!equipmentOk) continue;

    // Priority for territory subscribers where their agreement provides it:
    // an active flat-fee territory subscription that includes this city.
    const subscriberPriority = !!(agreement
      && agreement.territory_subscription?.is_flat_fee_subscription
      && (inTerritory || territoryCities.includes(cityNorm)));

    const stats = perf[p.id] || { offered: 0, positive: 0, completed: 0 };
    const acceptRate = stats.offered ? stats.positive / stats.offered : 0.75; // neutral default for new partners

    // Score: subscriber priority 40 · performance 30 · equipment fit 15 ·
    // base readiness 15. Deterministic, explainable, no hidden weighting.
    const score = (subscriberPriority ? 40 : 0) + Math.round(acceptRate * 30)
      + (wanted.length > 0 && equipment.length > 0 ? 15 : 0) + 15;

    candidates.push({ partner: p, agreement, subscriberPriority, score, stats });
  }

  candidates.sort((a, b) => b.score - a.score || String(a.partner.name).localeCompare(String(b.partner.name)));
  return candidates;
}

// ---------------------------------------------------------------------------
// Offering a wave
// ---------------------------------------------------------------------------

async function notifyPartner(srole, offer, request, settings) {
  const expiresLocal = new Date(offer.expires_at).toLocaleString('en-CA', { timeZone: 'America/Vancouver' });
  try {
    await srole.integrations.Core.SendEmail({
      to: offer.partner_email,
      from_name: 'Same Day Recycling',
      subject: `New job offer — ${request.city} (${request.service_type.replace(/_/g, ' ')})`,
      text: `New job offer in ${request.city}: ${request.items_description}. Preferred date: ${request.preferred_date || 'flexible'}. Fee terms: ${offer.fee_disclosure} Offer expires ${expiresLocal} — accept or decline in your partner dashboard: https://samedayrecycling.ca/partners`,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px">
          <div style="background:#187b65;border-radius:16px 16px 0 0;padding:20px 24px;color:#fff;font-weight:700">Same Day Recycling — New Job Offer</div>
          <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 16px 16px;padding:24px">
            <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#102b2a">${request.city}${request.province_code ? ', ' + request.province_code : ''}</p>
            <p style="margin:4px 0;color:#475569">${request.items_description}</p>
            <p style="margin:4px 0;color:#475569">Preferred date: <strong>${request.preferred_date || 'flexible'}</strong></p>
            <p style="margin:12px 0;padding:10px;background:#f4f7f5;border-radius:12px;color:#102b2a;font-size:14px"><strong>Fee terms:</strong> ${offer.fee_disclosure}</p>
            <p style="margin:12px 0;color:#ef4444;font-weight:600">Respond before ${expiresLocal} — after that the job is offered to the next contractor.</p>
            <a href="https://samedayrecycling.ca/partners" style="display:inline-block;background:#187b65;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:24px">Open your dashboard</a>
          </div>
        </div>`,
    });
  } catch (e) {
    console.error('Partner offer email failed:', (e && e.message) || e, 'partner:', offer.partner_email);
  }
}

// Offers the top candidates. Returns the offers created.
export async function offerWave(srole, request, { round = 1, exclude = [], createdBy = 'auto' } = {}) {
  const settings = await getSettings(srole);
  const windowMin = Math.max(5, Number(settings.response_window_minutes) || 45);
  const maxOffers = Math.max(1, Number(settings.max_offers_per_round) || 3);

  const candidates = (await findCandidates(srole, request))
    .filter((c) => !exclude.includes(c.partner.id))
    .slice(0, maxOffers);
  if (candidates.length === 0) return [];

  const feeValue = Number(request.quote_amount) || 0;
  const expiresAt = new Date(Date.now() + windowMin * 60 * 1000).toISOString();
  const offers = [];
  for (const c of candidates) {
    // Fee terms are computed from the agreement and disclosed BEFORE acceptance.
    const fee = computeFee({ agreement: c.agreement, jobSource: 'platform_generated', jobValue: feeValue });
    const offer = await srole.entities.LeadOffer.create({
      request_id: request.id,
      partner_id: c.partner.id,
      partner_name: c.partner.name,
      partner_email: c.partner.email || '',
      city: request.city,
      service_type: request.service_type,
      round,
      status: 'offered',
      offered_date: dateOnly(),
      expires_at: expiresAt,
      fee_disclosure: fee.disclosure,
      fee_amount: fee.fee,
      created_by: createdBy,
      notes: c.subscriberPriority ? 'Priority offer: active territory subscription covers this city.' : '',
    });
    offers.push(offer);
    await notifyPartner(srole, offer, request, settings);
    // Contractor dispatch alert by SMS, alongside the email offer.
    if (c.partner.phone) {
      await sendSms(srole, {
        to: c.partner.phone,
        body: `Same Day Recycling: new job offer — ${request.city} (${String(request.service_type || '').replace(/_/g, ' ')}). ${String(request.items_description || '').slice(0, 80)} Expires ${new Date(expiresAt).toLocaleString('en-CA', { timeZone: 'America/Vancouver' })}. Accept: https://samedayrecycling.ca/partners`,
        partner_id: c.partner.id,
        role: 'system',
      });
    }
  }

  await logContact(srole, request, {
    contact: `Auto-match round ${round}`,
    note: `Offered to: ${offers.map((o) => o.partner_name).join(', ')} — response window ${windowMin} min.`,
  });
  await srole.entities.NationalRequest.update(request.id, {
    status: 'provider_matching',
    dispatch_status: 'contractor_contacted',
    contacted_contractor: offers.map((o) => o.partner_name).join(', ').slice(0, 200),
  });
  await bumpDispatchTask(srole, request, {
    status: 'contractor_contacted',
    assigned_provider: offers.map((o) => o.partner_name).join(', ').slice(0, 200),
    contact_log_entry: { contact: `Auto-match round ${round}`, note: `Offers sent: ${offers.map((o) => o.partner_name).join(', ')}` },
  });
  return offers;
}

// Initial matching: called by nationalInquiry right after a request is saved.
export async function startMatching(srole, request) {
  const candidates = await findCandidates(srole, request);
  if (candidates.length === 0) return { offered: 0 };
  const offers = await offerWave(srole, request, { round: 1 });
  return { offered: offers.length };
}

// ---------------------------------------------------------------------------
// Contractor response
// ---------------------------------------------------------------------------

async function createBookingFromRequest(srole, request, partner, agreement, offer) {
  const jobValue = Number(request.quote_amount) || 0;
  const fee = computeFee({ agreement, jobSource: 'platform_generated', jobValue });
  return srole.entities.Booking.create({
    name: request.name,
    email: request.email || '',
    phone: request.phone,
    address: request.address || '',
    city: request.city,
    province_code: request.province_code || '',
    items_description: request.items_description,
    preferred_date: request.preferred_date || '',
    quote_estimate: request.quote_amount ? `$${request.quote_amount} (preliminary estimate)` : '',
    record_type: 'service',
    status: 'confirmed',
    assignment_status: 'accepted',
    partner_id: partner.id,
    partner_name: partner.name,
    job_value: jobValue,
    job_source: 'platform_generated',
    customer_origin_source: 'platform_generated',
    agreement_id: agreement ? agreement.id : '',
    fee_terms_snapshot: {
      rule: fee.rule,
      disclosure: fee.disclosure,
      fee: fee.fee,
      agreement_type: agreement?.agreement_type || '',
    },
    platform_fee_amount: fee.fee,
    contractor_net_amount: Math.max(0, jobValue - fee.fee),
    status_history: [{ status: 'accepted', date: iso() }],
  });
}

// Accept/decline by the offered contractor. Returns { ok } or { error }.
export async function respondToOffer(srole, { user, offerId, response }) {
  const partnerPage = await srole.entities.Partner.filter({ email: user.email }, { limit: 5 });
  const partner = toItems(partnerPage)[0];
  if (!partner || partner.active === false) return { error: 'No active partner account is linked to this email.', status: 403 };

  const offer = await srole.entities.LeadOffer.get(offerId);
  if (!offer || offer.partner_id !== partner.id) return { error: 'That offer is not yours.', status: 403 };
  if (offer.status !== 'offered') return { error: `This offer is already "${offer.status}".`, status: 409 };

  const request = await srole.entities.NationalRequest.get(offer.request_id);
  if (!request || ['confirmed', 'completed', 'cancelled'].includes(request.status)) {
    return { error: 'This request is no longer open.', status: 409 };
  }

  if (response === 'decline') {
    await srole.entities.LeadOffer.update(offer.id, { status: 'declined', responded_date: dateOnly() });
    await logContact(srole, request, { contact: partner.name, note: 'Declined the offer — escalating to the next eligible contractor.' });
    await bumpDispatchTask(srole, request, { contact_log_entry: { contact: partner.name, note: 'Declined the offer' } });
    await escalateRequest(srole, request, [partner.id]);
    return { ok: true, declined: true };
  }

  // Accept: fee terms disclosed at offer time are snapshotted onto the booking.
  const agreements = await srole.entities.ContractorAgreement.filter({ partner_id: partner.id }, { limit: 20 });
  const agreement = toItems(agreements).find((a) => a.status === 'active') || null;
  const booking = await createBookingFromRequest(srole, request, partner, agreement, offer);
  await srole.entities.LeadOffer.update(offer.id, { status: 'accepted', responded_date: dateOnly(), booking_id: booking.id });
  // Supersede any other open offers for the same request.
  const openOffers = await srole.entities.LeadOffer.filter({ request_id: request.id, status: 'offered' }, { limit: 50 });
  for (const o of toItems(openOffers)) {
    if (o.id !== offer.id) await srole.entities.LeadOffer.update(o.id, { status: 'superseded', responded_date: dateOnly() });
  }
  await srole.entities.NationalRequest.update(request.id, {
    status: 'confirmed',
    dispatch_status: 'contractor_accepted',
    partner_id: partner.id,
    partner_name: partner.name,
    appointment_date: request.preferred_date || '',
  });
  await logContact(srole, request, { contact: partner.name, note: `Accepted the offer. Booking created (${booking.id}).` });
  await bumpDispatchTask(srole, request, {
    status: 'contractor_accepted',
    assigned_provider: partner.name,
    contact_log_entry: { contact: partner.name, note: 'Accepted the offer' },
  });

  // Notify the customer and the administrator that a contractor accepted.
  try {
    const acceptedHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px">
        <div style="background:#187b65;border-radius:16px 16px 0 0;padding:20px 24px;color:#fff;font-weight:700">Your contractor is confirmed</div>
        <div style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 16px 16px;padding:24px">
          <p style="margin:0 0 8px">Hi ${request.name}, a verified local contractor in ${request.city} has accepted your request.</p>
          <p style="margin:4px 0;color:#475569">${request.items_description}</p>
          <p style="margin:4px 0;color:#475569">Target date: <strong>${request.preferred_date || 'being scheduled with you'}</strong></p>
          <p style="margin:12px 0;color:#475569">The contractor will call you at ${request.phone} to confirm the arrival window and final price before any work or payment.</p>
        </div>
      </div>`;
    if (request.email) {
      await srole.integrations.Core.SendEmail({
        to: request.email, from_name: 'Same Day Recycling',
        subject: 'A contractor accepted your request',
        text: `Hi ${request.name}, a verified local contractor in ${request.city} accepted your request. They will call you at ${request.phone} to confirm the arrival window and final price.`,
        html: acceptedHtml,
      });
    }
    const settings = await getSettings(srole);
    await srole.integrations.Core.SendEmail({
      to: settings.admin_email || 'samedayrecycling@gmail.com',
      from_name: 'Same Day Recycling',
      subject: `Job accepted: ${request.city} — ${partner.name}`,
      text: `${partner.name} accepted request ${request.reference_code || request.id}. Booking ${booking.id} created. Track it in /admin/jobs and /admin/national.`,
    });
  } catch (e) {
    console.error('Acceptance notification failed:', (e && e.message) || e);
  }

  return { ok: true, accepted: true, booking_id: booking.id };
}

// ---------------------------------------------------------------------------
// Escalation (expired offers → next wave → admin alert)
// ---------------------------------------------------------------------------

export async function runEscalation(srole) {
  const settings = await getSettings(srole);
  if (settings.auto_escalate === false) return { expired: 0, escalated: 0, alert_sent: 0 };
  const now = iso();
  const openPage = await srole.entities.LeadOffer.filter({ status: 'offered' }, { limit: 500 });
  const expired = toItems(openPage).filter((o) => o.expires_at && o.expires_at < now);
  let escalated = 0;
  let alerts = 0;
  for (const offer of expired) {
    const request = await srole.entities.NationalRequest.get(offer.request_id).catch(() => null);
    if (!request || ['confirmed', 'completed', 'cancelled'].includes(request.status)) {
      await srole.entities.LeadOffer.update(offer.id, { status: 'superseded', responded_date: dateOnly() });
      continue;
    }
    await srole.entities.LeadOffer.update(offer.id, { status: 'expired', responded_date: dateOnly() });
    await logContact(srole, request, { contact: offer.partner_name, note: 'Offer expired without a response.' });
    const next = await escalateRequest(srole, request, [offer.partner_id]);
    if (next.offered > 0) escalated += 1;
    if (next.alerted) alerts += 1;
  }
  return { expired: expired.length, escalated, alert_sent: alerts };
}

// Offers the next wave for a request, excluding contractors who already
// passed. If nobody is left, notifies the administrator once and leaves the
// request in the matching queue (status provider_matching — never a promise).
export async function escalateRequest(srole, request, exclude = []) {
  const prior = await srole.entities.LeadOffer.filter({ request_id: request.id }, { limit: 500 });
  const priorItems = toItems(prior);
  const excludeAll = [...new Set([...exclude, ...priorItems.map((o) => o.partner_id)])];
  const round = Math.max(1, ...priorItems.map((o) => Number(o.round) || 1)) + 1;

  const candidates = (await findCandidates(srole, request))
    .filter((c) => !excludeAll.includes(c.partner.id));
  if (candidates.length > 0) {
    const offers = await offerWave(srole, request, { round, exclude: excludeAll });
    return { offered: offers.length, alerted: false };
  }

  // All eligible contractors exhausted — admin takes over. Send the alert only
  // once per request (deduped by the contact log).
  const alreadyAlerted = (request.dispatch_contact_log || []).some((e) => String(e.note || '').includes('escalation_alert'));
  if (!alreadyAlerted) {
    await logContact(srole, request, { contact: 'System', note: 'escalation_alert: no contractor accepted — matching queue, admin action required.' });
    await bumpDispatchTask(srole, request, { contact_log_entry: { contact: 'System', note: 'escalation_alert: no contractor accepted' } });
    try {
      const settings = await getSettings(srole);
      await srole.integrations.Core.SendEmail({
        to: settings.admin_email || 'samedayrecycling@gmail.com',
        from_name: 'Same Day Recycling',
        subject: `No contractor accepted: ${request.city} — ${request.name}`,
        text: `Request ${request.reference_code || request.id} (${request.city}, ${request.service_type}) expired with every eligible contractor. Assign a contractor manually in /admin/national or recruit one. The customer has NOT been promised same-day service.`,
      });
    } catch (e) {
      console.error('Escalation alert failed:', (e && e.message) || e);
    }
    return { offered: 0, alerted: true };
  }
  return { offered: 0, alerted: false };
}

// ---------------------------------------------------------------------------
// Administrator authority: manual assign / reassign
// ---------------------------------------------------------------------------

// Manual assignment creates the booking immediately in "assigned" state; the
// contractor still accepts (or the admin marks it scheduled themselves).
export async function adminAssign(srole, { requestId, partnerId, adminName }) {
  const request = await srole.entities.NationalRequest.get(requestId);
  if (!request) return { error: 'Request not found.', status: 404 };
  const partner = await srole.entities.Partner.get(partnerId);
  if (!partner) return { error: 'Partner not found.', status: 404 };

  const agreements = await srole.entities.ContractorAgreement.filter({ partner_id: partnerId }, { limit: 20 });
  const agreement = toItems(agreements).find((a) => a.status === 'active') || null;
  const jobValue = Number(request.quote_amount) || 0;
  const fee = computeFee({ agreement, jobSource: 'platform_generated', jobValue });
  const booking = await srole.entities.Booking.create({
    name: request.name,
    email: request.email || '',
    phone: request.phone,
    address: request.address || '',
    city: request.city,
    province_code: request.province_code || '',
    items_description: request.items_description,
    preferred_date: request.preferred_date || '',
    record_type: 'service',
    status: 'contacted',
    assignment_status: 'assigned',
    partner_id: partner.id,
    partner_name: partner.name,
    job_value: jobValue,
    job_source: 'platform_generated',
    customer_origin_source: 'platform_generated',
    agreement_id: agreement ? agreement.id : '',
    fee_terms_snapshot: { rule: fee.rule, disclosure: fee.disclosure, fee: fee.fee, agreement_type: agreement?.agreement_type || '' },
    platform_fee_amount: fee.fee,
    contractor_net_amount: Math.max(0, jobValue - fee.fee),
    referred_by_admin: true,
    status_history: [{ status: 'assigned', date: iso(), by: adminName || 'admin' }],
  });
  await srole.entities.LeadOffer.create({
    request_id: request.id,
    booking_id: booking.id,
    partner_id: partner.id,
    partner_name: partner.name,
    partner_email: partner.email || '',
    city: request.city,
    service_type: request.service_type,
    round: 1,
    status: 'accepted',
    offered_date: dateOnly(),
    fee_disclosure: fee.disclosure,
    fee_amount: fee.fee,
    created_by: 'admin',
    notes: 'Manually assigned by the administrator.',
  });
  // Any open automated offers are superseded — manual authority wins.
  const openOffers = await srole.entities.LeadOffer.filter({ request_id: request.id, status: 'offered' }, { limit: 50 });
  for (const o of toItems(openOffers)) {
    await srole.entities.LeadOffer.update(o.id, { status: 'superseded', responded_date: dateOnly() });
  }
  await srole.entities.NationalRequest.update(request.id, {
    status: 'matched',
    dispatch_status: 'contractor_contacted',
    partner_id: partner.id,
    partner_name: partner.name,
  });
  await logContact(srole, request, { contact: adminName || 'Admin', note: `Manually assigned to ${partner.name}.` });
  await bumpDispatchTask(srole, request, {
    status: 'contractor_contacted',
    assigned_provider: partner.name,
    contact_log_entry: { contact: adminName || 'Admin', note: `Manually assigned to ${partner.name}` },
  });
  try {
    if (partner.email) {
      await srole.integrations.Core.SendEmail({
        to: partner.email, from_name: 'Same Day Recycling',
        subject: `Job assigned to you — ${request.city}`,
        text: `Dispatch assigned you a job in ${request.city}: ${request.items_description}. Preferred date: ${request.preferred_date || 'flexible'}. Fee terms: ${fee.disclosure} Accept it in your dashboard: https://samedayrecycling.ca/partners`,
      });
    }
  } catch (e) {
    console.error('Admin-assign email failed:', (e && e.message) || e);
  }
  // Contractor dispatch alert by SMS for manual assignments.
  if (partner.phone) {
    await sendSms(srole, {
      to: partner.phone,
      body: `Same Day Recycling dispatch: new job assigned to you — ${request.city}: ${String(request.items_description || '').slice(0, 80)}. Accept in your dashboard: https://samedayrecycling.ca/partners`,
      booking_id: booking.id,
      partner_id: partner.id,
      role: 'system',
    });
  }
  return { ok: true, booking_id: booking.id };
}

// Manual reassignment: pulls the job from one contractor and gives it to
// another. The old contractor's assignment is recorded as superseded.
export async function adminReassign(srole, { bookingId, newPartnerId, adminName }) {
  const booking = await srole.entities.Booking.get(bookingId);
  if (!booking) return { error: 'Booking not found.', status: 404 };
  const partner = await srole.entities.Partner.get(newPartnerId);
  if (!partner) return { error: 'New partner not found.', status: 404 };

  const agreements = await srole.entities.ContractorAgreement.filter({ partner_id: newPartnerId }, { limit: 20 });
  const agreement = toItems(agreements).find((a) => a.status === 'active') || null;
  const jobValue = Number(booking.job_value) || 0;
  const fee = computeFee({ agreement, jobSource: booking.job_source || 'platform_generated', jobValue });

  await srole.entities.Booking.update(bookingId, {
    partner_id: partner.id,
    partner_name: partner.name,
    assignment_status: 'assigned',
    agreement_id: agreement ? agreement.id : booking.agreement_id || '',
    fee_terms_snapshot: { rule: fee.rule, disclosure: fee.disclosure, fee: fee.fee, agreement_type: agreement?.agreement_type || '' },
    platform_fee_amount: fee.fee,
    contractor_net_amount: Math.max(0, jobValue - fee.fee),
    status_history: [...(booking.status_history || []), { status: 'reassigned', date: iso(), by: adminName || 'admin', from: booking.partner_name }],
  });
  await srole.entities.LeadOffer.create({
    request_id: booking.request_id || '',
    booking_id: booking.id,
    partner_id: partner.id,
    partner_name: partner.name,
    partner_email: partner.email || '',
    city: booking.city || '',
    service_type: booking.service_type || '',
    round: 1,
    status: 'accepted',
    offered_date: dateOnly(),
    fee_disclosure: fee.disclosure,
    fee_amount: fee.fee,
    created_by: 'admin',
    notes: 'Manually reassigned by the administrator.',
  });
  try {
    if (partner.email) {
      await srole.integrations.Core.SendEmail({
        to: partner.email, from_name: 'Same Day Recycling',
        subject: `Job assigned to you — ${booking.city || ''}`,
        text: `Dispatch assigned you a job in ${booking.city || ''}: ${booking.items_description}. Fee terms: ${fee.disclosure} Accept it in your dashboard: https://samedayrecycling.ca/partners`,
      });
    }
  } catch (e) {
    console.error('Reassign email failed:', (e && e.message) || e);
  }
  // Contractor dispatch alert by SMS for manual reassignments.
  if (partner.phone) {
    await sendSms(srole, {
      to: partner.phone,
      body: `Same Day Recycling dispatch: new job assigned to you — ${booking.city || ''}: ${String(booking.items_description || '').slice(0, 80)}. Accept in your dashboard: https://samedayrecycling.ca/partners`,
      booking_id: booking.id,
      partner_id: partner.id,
      role: 'system',
    });
  }
  return { ok: true };
}