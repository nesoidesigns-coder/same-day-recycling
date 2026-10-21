import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Lets a licensed business owner edit ONLY their own instance's branding.
// Never touches status, fees, plan or subscription fields — those stay admin/server-side.
export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST only.' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !user.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const srole = base44.asServiceRole;
    const { items } = await srole.entities.SoftwareLicense.filter({ email: user.email }, { limit: 1 });
    if (!items || !items.length) return Response.json({ error: 'No software license on this account.' }, { status: 404 });
    const lic = items[0];

    // Whitelisted, validated branding fields only.
    const patch = {};
    if (typeof body.brand_name === 'string') patch.brand_name = body.brand_name.trim().slice(0, 60);
    if (typeof body.brand_color === 'string') {
      const c = body.brand_color.trim();
      if (c && !/^#[0-9a-fA-F]{6}$/.test(c)) return Response.json({ error: 'Brand colour must be a hex value like #187B65.' }, { status: 400 });
      patch.brand_color = c;
    }
    if (typeof body.logo_uri === 'string') {
      const u = body.logo_uri.trim();
      if (u && !/^(base44:|https?:\/\/)/.test(u)) return Response.json({ error: 'Invalid logo reference.' }, { status: 400 });
      patch.logo_uri = u.slice(0, 500);
    }
    if (typeof body.support_email === 'string') {
      const e = body.support_email.trim().slice(0, 120);
      if (e && !e.includes('@')) return Response.json({ error: 'Support email is not valid.' }, { status: 400 });
      patch.support_email = e;
    }
    if (typeof body.support_phone === 'string') patch.support_phone = body.support_phone.trim().slice(0, 40);
    if (body.onboarding_complete === true) patch.onboarding_complete = true;

    if (!Object.keys(patch).length) return Response.json({ error: 'Nothing to update.' }, { status: 400 });
    await srole.entities.SoftwareLicense.update(lic.id, patch);

    return Response.json({
      ok: true,
      license: {
        id: lic.id,
        company: lic.company,
        brand_name: patch.brand_name ?? lic.brand_name,
        brand_color: patch.brand_color ?? lic.brand_color,
        logo_uri: patch.logo_uri ?? lic.logo_uri,
        support_email: patch.support_email ?? lic.support_email,
        support_phone: patch.support_phone ?? lic.support_phone,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}