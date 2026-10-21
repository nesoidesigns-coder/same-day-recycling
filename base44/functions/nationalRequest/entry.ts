import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { normalizePostal, provinceFromFsa } from '../../shared/geo.ts';
import { isActiveCity, ONBOARDING_CITIES } from '../../shared/coverageStatus.ts';

const SERVICE_TYPES = ['junk_removal', 'furniture', 'appliances', 'electronics', 'metal_pickup', 'cleanouts', 'other'];

// National service-request intake: accepts requests from every Canadian
// province and territory, matches verified local partners, and creates a
// provider recruitment task when no partner covers the market. Never
// guarantees a pickup before a provider (or dispatch) accepts the job.
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

    // Coverage status from the server-side source of truth — never invented.
    const cityNorm = city.toLowerCase().replace(/,\s*(bc|b\.c\.|on|qc|ab|sk|mb|ns|nb|pe|nl|yt|nt|nu).*$/, '').trim();
    let coverage_status = 'unverified';
    if (isActiveCity(city)) {
      coverage_status = 'verified';
    } else if (ONBOARDING_CITIES.some((c) => c.toLowerCase() === cityNorm)) {
      coverage_status = 'onboarding';
    }

    const srole = base44.asServiceRole;
    let status = 'recruiting';
    let quote_status = 'none';
    let partner_id = '';
    let partner_name = '';
    let recruitment_id = '';
    let message = '';

    if (coverage_status === 'verified') {
      // Verified operator territory — same-day service is live; dispatch confirms the window.
      status = 'provider_matching';
      message = `Same-day service is live in ${city}. Our dispatch team will contact you at ${phone} to confirm your pickup window and final price on arrival.`;
    } else {
      // Provider matching against the verified partner database (city match first).
      const partnerPage = await srole.entities.Partner.filter({ active: true }, { limit: 200 });
      const items = partnerPage.items || [];
      const partner = items.find((p) => String(p.city || '').toLowerCase().trim() === cityNorm) || null;
      if (partner) {
        partner_id = partner.id;
        partner_name = partner.name;
        status = 'matched';
        quote_status = 'pending_provider';
        message = `We've matched your request with a verified local provider in ${city}. They'll confirm availability and pricing, then you receive a confirmed quote and appointment. Nothing is scheduled until the provider accepts.`;
      } else {
        // No partner available — create or update a provider recruitment task
        // for this market (deduped per province + city).
        const recruitPage = await srole.entities.ProviderRecruit.filter({ source: 'recruitment_task' }, { limit: 200 });
        const existing = (recruitPage.items || []).find(
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
            company: `Local provider recruitment — ${city}${province_code ? ', ' + province_code : ''}`,
            province_code,
            territory: city,
            services: [service_type],
            outreach_status: 'not_contacted',
            partnership_status: 'prospect',
            source: 'recruitment_task',
            assigned_lead_count: 1,
            notes: 'Auto-created from a national service request. Customer contact is on the linked request record.',
          });
          recruitment_id = rec.id;
        }
        message = `No verified provider is confirmed in ${city} yet. Your request created a recruitment task for this market — our team contacts local recycling and removal companies directly. You'll receive a confirmed quote and appointment once a provider accepts. Nothing is scheduled or charged until then.`;
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