import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

    const name = str(body?.name, 80);
    const email = str(body?.email, 120);
    const phone = str(body?.phone, 30);
    const message = str(body?.message, 2000);

    if (!name || !email || !message) {
      return Response.json({ error: 'Missing required fields: name, email, message.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      from_name: 'Same Day Recycling Website',
      subject: `New website message: ${name}`,
      text: `Name: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\n\n${message}`,
      html: `<div style="font-family:sans-serif;max-width:560px">
        <h2 style="color:#0c3b24">New website message</h2>
        <p style="margin:4px 0"><strong>Name:</strong> ${name}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
        ${phone ? `<p style="margin:4px 0"><strong>Phone:</strong> ${phone}</p>` : ''}
        <p style="margin:12px 0;white-space:pre-wrap">${message}</p>
      </div>`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}