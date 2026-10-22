import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PHONE = '(604) 849-1745';
const SITE = 'samedayrecycling.ca';

const BUSINESS_FACTS = [
  'Same Day Recycling: professional same-day junk removal, furniture removal, appliance removal, estate & rental cleanouts, office/commercial cleanouts and recycling across Canada (Vancouver-based, phone ' + PHONE + ').',
  'Pricing is by truck space: $139 minimum pickup, 1/8 truck from $189, 1/4 truck from $269, 1/2 truck from $419, 3/4 truck from $549, full truck from $649. The quoted price is the price paid - if the load takes less space, the customer pays less, never more.',
  'Same-day pickup is usually available when booked before noon Vancouver time. Curbside pickups (items staged in the driveway/lane/garage front) save $25 and the customer does not need to be home.',
  'FREE metal pickup within Vancouver city limits (appliances, car parts, bikes); minimum charge applies in other cities.',
  'Every load is sorted for recycling or donation - reusable furniture goes to donation partners, and a Recycling Impact Report is emailed after every completed job.',
  'The Same Day Recycling Plan: $299/month for property managers and stratas, up to 4 pickups per month, priority same-day slots, no contract.',
  'Also sells the Recycling OS white-label booking platform for other junk removal businesses.',
].join('\n');

const vancouverMonday = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).formatToParts(now);
  const y = +parts.find((p) => p.type === 'year').value;
  const m = +parts.find((p) => p.type === 'month').value;
  const d = +parts.find((p) => p.type === 'day').value;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
  return dt.toISOString().slice(0, 10);
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'generate');
    const srole = base44.asServiceRole;
    const weekOf = vancouverMonday();

    if (action === 'generate') {
      const existing = await srole.entities.SocialPostDraft.filter({ week_of: weekOf });
      if ((existing || []).length >= 3) {
        return Response.json({ week_of: weekOf, posts: existing, already: true });
      }

      let questions = [];
      try {
        const qs = await srole.entities.ServiceQuery.list({ sort: '-created_date', limit: 6 });
        questions = (qs.items || []).map((q) => q.query_text).filter(Boolean);
      } catch {}

      const ai = await srole.integrations.Core.InvokeLLM({
        prompt:
          'You write social media promotional posts for ' + BUSINESS_FACTS + '\n\n' +
          'Questions customers actually asked recently (use for topical hooks where natural): ' + JSON.stringify(questions) + '\n\n' +
          'Write EXACTLY 3 ready-to-post social media captions to drive leads, each a DIFFERENT angle: ' +
          '(1) a service promo with a concrete pricing hook, ' +
          '(2) an eco/trust angle (recycling, donation, Recycling Impact Report), ' +
          '(3) an urgency/seasonal angle (same-day cutoff, curbside $25 discount, or free metal pickup in Vancouver).\n' +
          'Rules for each: 60-110 words, warm confident Canadian spelling, no emoji walls (max 2 emoji), no invented statistics or fake customer quotes, ' +
          'never quote prices not listed above, end with a clear call to action (' + PHONE + ' or ' + SITE + '). ' +
          'hashtags: 5-8 relevant hashtags as one string starting with #. cta: one short sentence describing the CTA. angle: 3-5 words naming the angle.',
        response_json_schema: {
          type: 'object',
          properties: {
            posts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  caption: { type: 'string' },
                  hashtags: { type: 'string' },
                  cta: { type: 'string' },
                  angle: { type: 'string' },
                },
                required: ['title', 'caption', 'hashtags', 'cta'],
              },
            },
          },
          required: ['posts'],
        },
      });

      const posts = (ai.posts || []).slice(0, 3);
      if (!posts.length) return Response.json({ error: 'Generation returned no posts' }, { status: 500 });

      const created = await srole.entities.SocialPostDraft.bulkCreate(
        posts.map((p) => ({
          week_of: weekOf,
          title: String(p.title || 'Social post'),
          caption: String(p.caption || '').slice(0, 2000),
          hashtags: String(p.hashtags || ''),
          cta: String(p.cta || ''),
          angle: String(p.angle || ''),
          status: 'draft',
        }))
      );
      return Response.json({ week_of: weekOf, posts: created });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not generate posts' }, { status: 500 });
  }
}