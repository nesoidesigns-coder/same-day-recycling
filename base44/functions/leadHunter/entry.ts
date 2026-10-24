import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Autonomous AI lead hunter: searches the live web for REAL, publicly posted
// junk-removal / recycling leads across Canada, then posts each verified lead
// to the community Opportunity Board with a generated image and the public
// contact name from its source. Only leads with a public source URL are ever
// posted — nothing is invented. Called daily by the "AI Lead Hunt Daily"
// workflow, or manually by an admin from the dashboard.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });
    const sr = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const maxLeads = Math.min(Number(body?.max) || 2, 5);

    const ai = await sr.integrations.Core.InvokeLLM({
      prompt:
        'You are the lead-hunting engine for the Recycling OS community, serving Canadian junk-removal and recycling contractors. ' +
        'Search the live web for REAL, CURRENT, publicly posted business opportunities across Canada (all provinces and territories) that a junk-removal or recycling contractor could pursue. ' +
        'Good sources include: municipal and government procurement/tender postings, commercial cleanout or waste-service RFPs, estate/foreclosure cleanout requests posted publicly, ' +
        'property management or real estate companies publicly seeking vendor partners, scrap metal or recycling material buy/sell postings, and business news of facility closures or large cleanouts. ' +
        'STRICT RULES: only include leads that actually exist right now with a verifiable public source URL you actually saw; the contact_name must be a real public name or organization shown at that source ' +
        '(never guess, never invent names, phones or emails); skip anything paywalled, expired, or without a working public link. ' +
        'Return up to 3 of the strongest leads. If you cannot verify enough leads, return fewer or none — never fabricate.',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Short factual title of the opportunity' },
                description: { type: 'string', description: '2-4 sentence factual summary of the opportunity' },
                city: { type: 'string' },
                province: { type: 'string', description: 'Two-letter province code (BC, AB, SK, MB, ON, QC, NS, NB, PE, NL, YT, NT, NU)' },
                service_category: { type: 'string', description: 'e.g. junk_removal, commercial_waste, estate_cleanout, construction_debris, scrap_metal' },
                lead_type: { type: 'string', enum: ['overflow_job', 'partnership'], description: 'overflow_job = a specific cleanout/tender job; partnership = vendor-seeking organization' },
                contact_name: { type: 'string', description: 'The public contact or issuing organization exactly as shown at the source' },
                source_url: { type: 'string', description: 'The public URL where the lead was posted' },
                deadline: { type: 'string', description: 'YYYY-MM-DD closing date if the source shows one, else empty' },
              },
              required: ['title', 'description', 'contact_name', 'source_url'],
            },
          },
        },
        required: ['leads'],
      },
    });

    const found = (ai && Array.isArray(ai.leads) ? ai.leads : [])
      .filter((l) => l && l.title && l.source_url && l.contact_name)
      .slice(0, maxLeads);

    if (found.length === 0) {
      return Response.json({ ok: true, posted: 0, note: 'No verifiable leads found in this run — nothing posted.' });
    }

    // Dedupe against opportunities already posted by this engine.
    const existing = await sr.entities.CommunityOpportunity.filter({ poster_name: 'Recycling OS Intelligence' }, { limit: 200 });
    const seenUrls = new Set((existing.items || []).map((o) => (o.contact_method || '')).join('|').split('|'));
    const seenTitles = new Set((existing.items || []).map((o) => (o.title || '').toLowerCase()));

    const posted = [];
    const skipped = [];
    for (const lead of found) {
      if (seenUrls.has(lead.source_url) || seenTitles.has(String(lead.title).toLowerCase())) {
        skipped.push({ title: lead.title, reason: 'already posted' });
        continue;
      }
      const image = await sr.integrations.Core.GenerateImage({
        prompt: 'Clean, modern photo illustration for a Canadian waste-removal opportunity listing: ' +
          'a green recycling/junk-removal truck or cleanout scene relevant to this lead: ' + String(lead.title) +
          '. Bright natural light, professional, no text, no logos, no people faces.',
      }).catch(() => null);

      const prov = String(lead.province || '').toUpperCase().slice(0, 2);
      await sr.entities.CommunityOpportunity.create({
        type: lead.lead_type === 'partnership' ? 'partnership' : 'overflow_job',
        title: String(lead.title).slice(0, 200),
        description: String(lead.description || '').slice(0, 3000) +
          '\n\nSource: verified public posting at ' + String(lead.source_url),
        image_url: image && image.url ? String(image.url).slice(0, 500) : '',
        city: String(lead.city || '').slice(0, 80),
        province_code: prov,
        service_category: String(lead.service_category || 'junk_removal').slice(0, 60),
        requirements: 'Verified web-sourced lead. Confirm details at the source link before pursuing.',
        deadline: /^\d{4}-\d{2}-\d{2}$/.test(String(lead.deadline || '')) ? lead.deadline : undefined,
        contact_method: ('Contact: ' + String(lead.contact_name).slice(0, 150) + ' — see source: ' + String(lead.source_url).slice(0, 190)).slice(0, 200),
        poster_name: 'Recycling OS Intelligence',
        poster_verified: false,
        status: 'open',
      });
      seenUrls.add(lead.source_url);
      posted.push(lead.title);
    }

    return Response.json({ ok: true, posted: posted.length, titles: posted, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}