import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { computeQuote, DEFAULT_PRICES } from '../../shared/pricing.ts';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';

export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const svc = base44.asServiceRole;
    const body = await req.json();
    const leadId = body?.lead_id;
    if (!leadId) return Response.json({ error: 'Provide lead_id.' }, { status: 400 });

    const lead = await svc.entities.RealtorLead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found.' }, { status: 404 });

    // Load current pricing (general/city-default settings)
    let prices = DEFAULT_PRICES;
    try {
      const page = await svc.entities.PricingSettings.filter(
        { $or: [{ city: { $exists: false } }, { city: '' }] },
        { limit: 1 }
      );
      const rows = (Array.isArray(page) ? page : page?.items) || [];
      if (rows[0]) prices = { ...DEFAULT_PRICES, ...rows[0] };
    } catch {}

    // 1. Estimate the load size and price it
    let quote = null;
    const desc = String(lead.items_description || '').trim();
    if (desc) {
      try {
        const llm = await svc.integrations.Core.InvokeLLM({
          prompt: 'A realtor described the items to remove from a listing property: "' + desc + '". Estimate the truck space in EIGHTHS of a full junk-removal truck (0 to 8). Rough guide: one sofa = 1.2, loveseat = 0.8, mattress or box spring = 0.8, fridge or washer = 0.8-1.0, dresser or table = 0.7, TV = 0.3, one bag or box = 0.15, a small renovation debris pile = 2-4, a full garage = 8, a full house or estate = 6-8. Be conservative, do not overestimate.',
          response_json_schema: {
            type: 'object',
            properties: { truck_eighths: { type: 'number' } },
            required: ['truck_eighths'],
          },
        });
        const eighths = Math.max(0, Math.min(8, Number(llm?.truck_eighths) || 0));
        if (eighths > 0) quote = computeQuote(eighths, prices);
      } catch {}
    }

    // 2. Draft the reply the owner can send the realtor (text or email)
    let aiReply = '';
    try {
      aiReply = await svc.integrations.Core.InvokeLLM({
        prompt: 'Write a short, warm, professional reply (2-4 sentences, plain text, no greeting signature block) from Same Day Recycling to realtor ' + lead.agent_name
          + (lead.brokerage ? ' of ' + lead.brokerage : '')
          + ' who requested a cleanout at "' + (lead.property_address || '') + '"'
          + (lead.city ? ' in ' + lead.city : '')
          + '. Items to remove: ' + (desc || 'not specified') + '. '
          + (quote ? 'The estimated price is ' + quote.range + ' (' + quote.label + '); mention it as an estimate confirmed on arrival before anything is lifted. ' : 'Do not quote a price; say we will confirm an upfront flat price, and offer a free estimate. ')
          + 'Offer same-day service when booked before noon, mention we recycle and donate what is salvageable, and invite them to confirm a time or call (604) 849-1745. No em-dashes, no bullet points, no markdown.',
      });
    } catch {}

    // 3. Save the AI results on the lead
    const payload = {
      ok: true,
      lead_id: leadId,
      agent_name: lead.agent_name,
      brokerage: lead.brokerage || '',
      phone: lead.phone || '',
      email: lead.email || '',
      city: lead.city || '',
      property_address: lead.property_address || '',
      items_description: desc,
      preferred_date: lead.preferred_date || '',
      quote_range: quote ? quote.range : '',
      load_label: quote ? quote.label : '',
      ai_reply: String(aiReply || '').slice(0, 2000),
      owner_email: OWNER_EMAIL,
    };
    await svc.entities.RealtorLead.update(leadId, {
      ...(quote ? { load_label: quote.label, quote_low: quote.low, quote_high: quote.high } : {}),
      ...(aiReply ? { ai_reply: payload.ai_reply } : {}),
      ai_processed: true,
    });

    // 4. Email the owner the AI-processed alert
    try {
      await svc.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        template_name: 'RealtorLeadAlert',
        variables: {
          agent_name: payload.agent_name,
          brokerage: payload.brokerage,
          phone: payload.phone,
          email: payload.email,
          city: payload.city,
          property_address: payload.property_address,
          items_description: payload.items_description,
          preferred_date: payload.preferred_date,
          quote_range: payload.quote_range,
          load_label: payload.load_label,
          ai_reply: payload.ai_reply,
        },
      });
    } catch {}

    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}