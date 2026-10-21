import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { normalizePostal, provinceFromFsa } from '../../shared/geo.ts';
import { isActiveCity } from '../../shared/coverageStatus.ts';

const SERVICE_TYPES = ['junk_removal', 'furniture', 'appliances', 'electronics', 'metal_pickup', 'cleanouts', 'other'];

// Nationwide inquiry intake — the heart of the business model:
//   customer demand -> contractor recruitment -> software sales -> expansion.
// EVERY Canadian municipality is active for inquiries. Nothing is discarded
// for lacking a contractor, and nothing is guaranteed before a provider
// accepts. Markets with confirmed operational capacity keep direct booking.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'nationalRequest', 20);
    if (!limited.allowed) return rateLimitedResponse();

    const body = await req.json();
    const str = (v, max = 200) => String(v || '').trim().slice(0, max);
    const name = str(body.name, 120);
    const phone = str(body.phone, 40);
    const city = str(body.city, 120);
    const service_type = SERVICE_TYPES.includes(body.service_type) ? body.service_type : 'other';
    const items_description = str(body.items_description, 1000);
    if (!name || !phone || !city || !items_description) {
      return Response.json(
        { error: 'Missing required details: name, phone, city and a description of the items.' },
        { status: 422 }
      );
    }

    const email = str(body.email, 200);
    const address = str(body.address, 200);
    const notes = str(body.notes, 1000);
    const preferred_date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.preferred_date || '')) ? body.preferred_date : '';

    // Province: derived from the postal-code FSA (Canada Post standard),
    // falling back to the customer-selected province/territory.
    const fsa = normalizePostal(body.postal_code);
    let province_code = fsa ? provinceFromFsa(fsa) : '';
    if (!province_code) {
      const selected = String(body.province_code || '').toUpperCase().slice(0, 2);
      if (['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'].includes(selected)) {
        province_code = selected;
      }
    }

    // Service-verification state (never blocks the inquiry): operator cities
    // have guaranteed same-day capacity; everyone else is matched or recruited.
    const cityNorm = city.toLowerCase().replace(/,\s*(bc|b\.c\.|on|qc|ab|sk|mb|ns|nb|pe|nl|yt|nt|nu).*$/, '').trim();
    let coverage_status = 'unverified';
    if (isActiveCity(city)) coverage_status = 'verified';

    const srole = base44.asServiceRole;
    let status = 'recruiting';
    let quote_status = 'none';
    let partner_id = '';
    let partner_name = '';
    let recruitment_id = '';
    let message = '';

    if (coverage_status === 'verified') {
      // Confirmed operational capacity — dispatch confirms the same-day window.
      status = 'provider_matching';
      message = `Same-day service is confirmed in ${city}. Our dispatch team will contact you at ${phone} to confirm your pickup window and final price on arrival.`;
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
        message = `Your inquiry is saved. We've matched it with a verified local provider in ${city} — they'll confirm availability and pricing, then you receive a confirmed quote and appointment. Local service availability and scheduling are confirmed after your request.`;
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
        message = `Your inquiry is saved. ${city} is active for customer inquiries — local service availability and scheduling are confirmed after your request. We'll contact you at ${phone} as soon as a local provider is matched or recruitment in ${city} completes. Nothing is scheduled or charged before a provider accepts.`;
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

    return Response.json({
      ok: true,
      request_id: record.id,
      status,
      coverage_status,
      province_code,
      reference_code,
      message,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}