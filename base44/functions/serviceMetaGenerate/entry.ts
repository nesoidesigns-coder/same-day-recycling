import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

// Generates local-SEO meta titles + descriptions for every service page with AI,
// stores them in ServicePageMeta (the live pages pick them up automatically), and
// returns the results. Admin-only; safe to re-run — it upserts by path.
const PAGES = [
  {
    path: '/furniture-removal',
    h1: 'Furniture removal and recycling, done the responsible way',
    current_description: 'Sofas, mattresses, dressers and more picked up in confirmed service areas across Canada. Upfront pricing, donation and recycling first — get an instant quote.',
    selling_points: 'Sofas, couches, mattresses, box springs, dressers, tables, office furniture, hot tubs. Donation-first disposal, $139 minimum pickup, crew does all lifting, $25 curbside discount.',
  },
  {
    path: '/appliance-removal',
    h1: 'Appliance removal with metal recycled, not landfilled',
    current_description: 'Fridges, washers, stoves and more removed in confirmed service areas across Canada. Appliances recycled as scrap metal — upfront pricing and instant quotes.',
    selling_points: 'Fridges, freezers, washers, dryers, stoves, dishwashers, microwaves. Appliances recycled as scrap metal, upfront pricing, instant photo quotes, same-day when booked before noon.',
  },
  {
    path: '/electronics-recycling',
    h1: 'E-waste pickup sent to certified recycling',
    current_description: 'TVs, computers, printers and office e-waste collected in confirmed service areas across Canada and sent to certified recycling — upfront pricing, instant quotes.',
    selling_points: 'TVs, computers, printers, monitors, office e-waste. Certified electronics recycling, upfront pricing, instant quotes, residential and business pickups.',
  },
  {
    path: '/commercial-recycling',
    h1: 'Commercial and office recycling programs for Canadian businesses',
    current_description: 'Office furniture, e-waste, fit-out debris and recurring pickup programs for businesses across Canada — with a diversion record for every completed job.',
    selling_points: 'Office furniture, e-waste, fit-out debris, recurring scheduled pickups, diversion-rate certificate for every completed job, one invoice for repeat cleanouts.',
  },
  {
    path: '/same-day-pickup',
    h1: 'Same-day junk and furniture pickup',
    current_description: 'Same-day junk, furniture and appliance pickup in confirmed service areas across Canada. Book before noon for same-afternoon service, with upfront pricing approved before loading.',
    selling_points: 'Book before noon for same-afternoon service; nationwide intake with local availability confirmed after the request; upfront pricing approved before anything is lifted.',
  },
  {
    path: '/free-metal-pickup',
    h1: 'Free scrap metal pickup',
    current_description: 'Check free scrap metal pickup in confirmed service areas. Describe your metal items, request collection and confirm eligibility with the team.',
    selling_points: 'Free scrap metal pickup within Vancouver city limits (appliances, bikes, car parts, metal items); other cities have a minimum pickup charge. We recycle and resell the metal.',
  },
  {
    path: '/services',
    h1: 'Explore every recycling and removal service by city',
    current_description: 'Search every Canadian city and province we cover, check availability by postal code, and browse residential and commercial recycling and removal services — with honest, verified coverage status.',
    selling_points: 'Search by city or postal code, browse residential and commercial recycling and removal services, honest verified coverage status, instant online quotes.',
  },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in as the site owner to run the SEO generator.' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required.' }, { status: 403 });

    const briefs = PAGES.map((p) =>
      `PAGE ${p.path}\nHeading: ${p.h1}\nWhat the page offers: ${p.selling_points}\nCurrent description: ${p.current_description}`
    ).join('\n\n');

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a local-SEO copywriter for Same Day Recycling (samedayrecycling.ca), a same-day junk removal, furniture removal and recycling service with a nationwide Canadian partner network. ' +
        'Write a search-optimized meta title and meta description for each of the service pages below, tuned for LOCAL searches (e.g. "junk removal Vancouver", "furniture removal Surrey", "appliance removal near me").\n\n' +
        'HARD RULES:\n' +
        '- Title: 55-60 characters max, include the brand name "Same Day Recycling" and the core service keyword first.\n' +
        '- Description: 140-158 characters, end with a call to action.\n' +
        '- City mentions: service requests are open across all of Canada, but confirmed same-day service is ONLY live in the Lower Mainland BC cities (Vancouver, Burnaby, Surrey, Richmond, Coquitlam). Name ONLY these five cities in metas, and phrase them as request availability ("service requests open in Vancouver and Surrey"), never as guaranteed completed service. For broad claims use "across Canada".\n' +
        '- NEVER claim guaranteed same-day pickup nationwide — same-day fulfillment is only confirmed where a verified local contractor is live. Safe phrasings: "book before noon", "same-day in confirmed areas", "availability confirmed on request".\n' +
        '- FREE metal pickup is a Vancouver-only offer; do not attach "free metal pickup" to other pages.\n' +
        '- Every title and description must be unique and must describe only that page\'s service.\n' +
        '- Also list 3-5 focus keywords per page (mix of service + city + intent terms).\n\n' + briefs,
      response_json_schema: {
        type: 'object',
        properties: {
          pages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                focus_keywords: { type: 'array', items: { type: 'string' } },
              },
              required: ['path', 'title', 'description'],
            },
          },
        },
        required: ['pages'],
      },
    });

    const today = new Date().toISOString().slice(0, 10);
    const validPaths = new Set(PAGES.map((p) => p.path));
    const results = [];
    for (const m of (ai.pages || [])) {
      const path = String(m.path || '').split(/[?#]/)[0];
      if (!validPaths.has(path)) continue;
      const title = String(m.title || '').trim().slice(0, 110);
      const description = String(m.description || '').trim().slice(0, 300);
      if (!title || !description) continue;
      const row = {
        path,
        title,
        description,
        focus_keywords: (m.focus_keywords || []).join(', '),
        generated_date: today,
      };
      const existing = await base44.asServiceRole.entities.ServicePageMeta.filter({ path }, { limit: 1 });
      if (existing.items && existing.items.length) {
        await base44.asServiceRole.entities.ServicePageMeta.update(existing.items[0].id, row);
      } else {
        await base44.asServiceRole.entities.ServicePageMeta.create(row);
      }
      results.push(row);
    }

    return Response.json({ ok: true, updated: results.length, pages: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}