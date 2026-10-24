import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const items = (r) => (r && r.items ? r.items : Array.isArray(r) ? r : []);

// Contractor opportunity board posting gate. Only verified contractors (or
// existing platform partners / license holders / admins) may post
// opportunities. Accepting an opportunity never creates a booking or any
// financial obligation — this board is member-to-member networking only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    if (body?.action === 'eligibility') {
      const status = await checkEligibility(base44, user);
      return Response.json(status);
    }

    if (body?.action === 'create') {
      const eligibility = await checkEligibility(base44, user);
      if (!eligibility.eligible) {
        return Response.json({ error: eligibility.reason }, { status: 403 });
      }
      const title = String(body?.title || '').trim().slice(0, 200);
      if (!title) return Response.json({ error: 'A title is required.' }, { status: 400 });
      const str = (v, max) => String(v || '').trim().slice(0, max);
      const rec = await base44.asServiceRole.entities.CommunityOpportunity.create({
        type: ['overflow_job', 'subcontracting', 'partnership', 'equipment_available', 'crew_available', 'collaboration'].includes(body?.type) ? body.type : 'overflow_job',
        title,
        description: str(body.description, 3000),
        city: str(body.city, 80),
        province_code: str(body.province_code, 20),
        service_category: str(body.service_category, 60),
        requirements: str(body.requirements, 1000),
        deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(body?.deadline || '')) ? body.deadline : '',
        contact_method: str(body.contact_method, 200),
        status: 'open',
        poster_name: eligibility.poster_name || eligibility.business_name || user.email,
        poster_verified: eligibility.verified,
      });
      return Response.json({ ok: true, opportunity: rec });
    }

    return Response.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function checkEligibility(base44, user) {
  if (user.role === 'admin') {
    return { eligible: true, verified: true, poster_name: user.full_name || 'Same Day Recycling team' };
  }
  const profilePage = await base44.asServiceRole.entities.CommunityProfile.filter({ owner_email: user.email }, { limit: 1 });
  const profile = items(profilePage)[0];
  if (profile?.suspended) return { eligible: false, reason: 'Your community account is suspended. Contact the Same Day Recycling team.' };
  const partners = items(await base44.asServiceRole.entities.Partner.filter({ email: user.email }, { limit: 1 }));
  const licenses = items(await base44.asServiceRole.entities.SoftwareLicense.filter({ email: user.email }, { limit: 1 }));
  if (profile?.verification_status === 'verified' || partners.length || licenses.length) {
    return {
      eligible: true,
      verified: profile?.verification_status === 'verified' || partners.length > 0,
      poster_name: profile?.display_name || '',
      business_name: profile?.business_name || partners[0]?.name || licenses[0]?.company || '',
    };
  }
  return { eligible: false, reason: 'Only verified contractors can post opportunities. Request business verification from your community profile first.' };
}