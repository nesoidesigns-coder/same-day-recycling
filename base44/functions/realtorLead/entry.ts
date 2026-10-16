import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

    const agent_name = str(body?.agent_name, 80);
    const email = str(body?.email, 120);
    const phone = str(body?.phone, 30);
    const property_address = str(body?.property_address, 200);
    if (!agent_name || !email || !phone || !property_address) {
      return Response.json({ error: 'Missing required fields: agent_name, email, phone, property_address.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const brokerage = str(body?.brokerage, 120);
    const city = str(body?.city, 60);
    const items_description = str(body?.items_description, 1000);
    const preferred_date = str(body?.preferred_date, 20);

    const lead = await base44.entities.RealtorLead.create({
      agent_name,
      email,
      phone,
      property_address,
      ...(brokerage ? { brokerage } : {}),
      ...(city ? { city } : {}),
      ...(items_description ? { items_description } : {}),
      ...(preferred_date ? { preferred_date } : {}),
    });

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        from_name: 'Same Day Recycling Website',
        subject: `New realtor lead: ${agent_name}${city ? ` — ${city}` : ''}`,
        text: `New realtor lead from the landing page.\nAgent: ${agent_name}${brokerage ? ` (${brokerage})` : ''}\nPhone: ${phone}\nEmail: ${email}\nProperty: ${property_address}${city ? `, ${city}` : ''}\nItems: ${items_description || '—'}\nPreferred date: ${preferred_date || 'any'}`,
        html: `<div style="font-family:sans-serif;max-width:560px">
          <h2 style="color:#0c3b24">New realtor lead</h2>
          <p style="margin:4px 0"><strong>Agent:</strong> ${agent_name}${brokerage ? ` (${brokerage})` : ''}</p>
          <p style="margin:4px 0"><a href="tel:${phone}" style="color:#1d9e56;font-weight:bold">${phone}</a> · ${email}</p>
          <p style="margin:4px 0"><strong>Property:</strong> ${property_address}${city ? `, ${city}` : ''}</p>
          <p style="margin:4px 0"><strong>Items:</strong> ${items_description || '—'}</p>
          <p style="margin:4px 0"><strong>Preferred date:</strong> ${preferred_date || 'any'}</p>
          <p style="margin-top:16px;color:#64748b;font-size:13px">Manage leads in the admin dashboard → /admin/jobs (Leads tab)</p>
        </div>`,
      });
    } catch (e) {
      // non-fatal — the lead is saved either way
    }

    return Response.json({ ok: true, lead_id: lead?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}