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

    // The "Realtor Lead AI" workflow takes it from here: it prices the load,
    // drafts the reply and emails the owner the full AI-processed alert.

    return Response.json({ ok: true, lead_id: lead?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}