import { normalizePostal, provinceFromFsa } from './geo.ts';
import { isActiveCity } from './coverageStatus.ts';

const SERVICE_TYPES = ['junk_removal', 'furniture', 'appliances', 'electronics', 'metal_pickup', 'cleanouts', 'other'];

// Shared nationwide inquiry engine — the heart of the business model:
//   customer demand -> contractor recruitment -> software sales -> expansion.
// Accepts inquiries from EVERY Canadian municipality. Never discards an
// inquiry for lacking a contractor, and never guarantees a pickup before a
// provider accepts. Markets with no verified contractor get a recruitment
// task, deduped per market.
export async function submitNationalInquiry(base44, input) {
  const srole = base44.asServiceRole;
  const str = (v, max = 200) => String(v || '').trim().slice(0, max);
  const name = str(input.name, 120);
  const phone = str(input.phone, 40);
  const city = str(input.city, 120);
  const items_description = str(input.items_description, 1000);
  if (!name || !phone || !city || !items_description) {
    return { ok: false, error: 'Missing required details: name, phone, city and a description of the items.' };
  }

  const email = str(input.email, 200);
  const address = str(input.address, 200);
  const notes = str(input.notes, 1000);
  const service_type = SERVICE_TYPES.includes(input.service_type) ? input.service_type : 'other';
  const preferred_date = /^\d{4}-\d{2}-\d{2}$/.test(String(input.preferred_date || '')) ? input.preferred_date : '';

  // Province: derived from the postal-code FSA (Canada Post standard),
  // falling back to the customer-selected province/territory.
  const fsa = normalizePostal(input.postal_code);
  let province_code = fsa ? provinceFromFsa(fsa) : '';
  if (!province_code) {
    const selected = String(input.province_code || '').toUpperCase().slice(0, 2);
    if (['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'].includes(selected)) {
      province_code = selected;
    }
  }

  // Service-verification state (never blocks the inquiry): operator cities
  // have guaranteed same-day capacity; everyone else is matched or recruited.
  const cityNorm = city.toLowerCase().replace(/,\s*(bc|b\.c\.|on|qc|ab|sk|mb|ns|nb|pe|nl|yt|nt|nu).*$/, '').trim();
  let coverage_status = 'unverified';
  if (isActiveCity(city)) coverage_status = 'verified';

  let status = 'recruiting';
  let quote_status = 'none';
  let partner_id = '';
  let partner_name = '';
  let recruitment_id = '';
  let message = '';

  let needsRecruitAlert = false;
  if (coverage_status === 'verified') {
    // Operator-run city: warn admins when the verified contractor network is
    // empty, so dispatch still has people to assign when the window opens.
    try {
      const [pc, rc] = await Promise.all([
        srole.entities.Partner.count({ active: true }),
        srole.entities.ProviderRecruit.count({ verified: true }),
      ]);
      if (((pc || 0) + (rc || 0)) === 0) needsRecruitAlert = true;
    } catch { /* counts are best-effort */ }
    // Confirmed operational capacity — dispatch confirms the same-day window.
    status = 'provider_matching';
    message = `Request received for ${city}. We operate nationwide — our dispatch team is arranging your local contractor and will call you at ${phone} to confirm pricing and your arrival window before the appointment is guaranteed.`;
  } else {
    // Match against verified partners (city) and verified recruits (territory).
    const [partnerPage, recruitPage] = await Promise.all([
      srole.entities.Partner.filter({ active: true }, { limit: 200 }),
      srole.entities.ProviderRecruit.filter({ verified: true }, { limit: 500 }),
    ]);
    const partner = (partnerPage.items || []).find((p) => String(p.city || '').toLowerCase().trim() === cityNorm) || null;
    const recruit = (recruitPage.items || []).find((r) => String(r.territory || '').toLowerCase().trim() === cityNorm) || null;
    const matched = partner || recruit;
    if (matched) {
      partner_id = matched.id;
      partner_name = matched.name || matched.company;
      status = 'matched';
      quote_status = 'pending_provider';
      message = `Your request is saved. We operate nationwide — our dispatch team is confirming your local contractor in ${city}. Pricing, pickup availability and your arrival window are confirmed before any appointment is guaranteed. We'll contact you at ${phone}.`;
    } else {
      // No contractor in this market yet — keep the inquiry and open a
      // recruitment task: demand here drives contractor recruitment.
      const taskPage = await srole.entities.ProviderRecruit.filter({ source: 'recruitment_task' }, { limit: 200 });
      const existing = (taskPage.items || []).find(
        (r) => (r.territory || '').toLowerCase().trim() === cityNorm
          && (!province_code || r.province_code === province_code)
          && r.partnership_status !== 'declined'
      );
      if (existing) {
        recruitment_id = existing.id;
        await srole.entities.ProviderRecruit.update(existing.id, {
          assigned_lead_count: (existing.assigned_lead_count || 0) + 1,
        });
      } else {
        const rec = await srole.entities.ProviderRecruit.create({
          company: `Contractor opportunity — ${city}${province_code ? ', ' + province_code : ''}`,
          province_code,
          territory: city,
          services: [service_type],
          outreach_status: 'not_contacted',
          partnership_status: 'prospect',
          source: 'recruitment_task',
          assigned_lead_count: 1,
          notes: 'Auto-created from a national customer inquiry. Contact the customer and recruit a local contractor for this demand.',
        });
        recruitment_id = rec.id;
      }
      // No contractor available in this market — admins must recruit or
      // manually assign one before anything is promised to the customer.
      needsRecruitAlert = true;
      message = `Your request is saved. We operate in every Canadian city — our dispatch team is sourcing your local contractor in ${city}. We'll contact you at ${phone} with pricing, pickup availability and your arrival window as soon as a contractor is confirmed. Nothing is scheduled or charged before a contractor accepts.`;
    }
  }

  const reference_code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();

  const record = await srole.entities.NationalRequest.create({
    name,
    email,
    phone,
    address,
    city,
    province_code,
    postal_code: fsa,
    service_type,
    items_description,
    preferred_date,
    notes,
    coverage_status,
    partner_id,
    partner_name,
    recruitment_id,
    status,
    quote_status,
    reference_code,
  });

  // Rule 5: EVERY new request automatically opens a dispatch task, so
  // fulfillment is tracked from contractor sourcing through payment — no
  // market ever waits on a pre-enrolled contractor to accept a request.
  const dispatch = await srole.entities.DispatchTask.create({
    request_id: record.id,
    reference_code,
    city,
    province_code,
    customer_name: name,
    service_type,
    status: 'awaiting_contractor',
    assigned_provider: partner_name,
    notes: 'Auto-created when the request arrived. Search, contact and qualify local contractors (registered or newly sourced), confirm pricing and the arrival window, then assign and schedule.',
  });
  await srole.entities.NationalRequest.update(record.id, {
    dispatch_task_id: dispatch.id,
    dispatch_status: 'awaiting_contractor',
  });

  // Admin alert: no verified contractor available for this request.
  if (needsRecruitAlert) {
    try {
      await srole.integrations.Core.SendEmail({
        to: 'samedayrecycling@gmail.com',
        from_name: 'Same Day Recycling',
        subject: `Dispatch needed: ${city}${province_code ? ', ' + province_code : ''} — no verified contractor`,
        text: `Request ${reference_code} from ${city}${province_code ? ', ' + province_code : ''} has no verified contractor available. Recruit or manually assign a contractor in the dispatch center (/admin/national). Customer: ${name}, ${phone}. Nothing is promised to the customer until a contractor accepts.`,
      });
    } catch (e) {
      console.error('Admin dispatch alert failed:', (e && e.message) || e);
    }
  }

  return {
    ok: true,
    request_id: record.id,
    status,
    coverage_status,
    province_code,
    reference_code,
    dispatch_task_id: dispatch.id,
    dispatch_status: 'awaiting_contractor',
    message,
  };
}