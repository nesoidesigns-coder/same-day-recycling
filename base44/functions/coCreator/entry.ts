import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const BIZ_FACTS = `Same Day Recycling — same-day junk removal, furniture/appliance removal, estate & rental cleanouts, renovation debris, office cleanouts, curbside pickup and free metal pickup (free within Vancouver city limits only, minimum charge elsewhere). Pricing is by truck space: minimum pickup ~$149 up to full truck ~$649. Serves Vancouver, Burnaby, Richmond, Surrey, Coquitlam/Tri-Cities, North & West Vancouver, New Westminster, Delta, Langley, Kamloops and Kelowna. Book before noon for same-day service. Eco disposal: loads sorted to recycle or donate first. Phone (604) 849-1745, website samedayrecycling.ca. Cannot take hazardous materials (paint, chemicals, asbestos, fuel, solvents, propane tanks).`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'ideas';

    if (action === 'ideas') {
      const { items } = await base44.entities.ServiceQuery.filter({}, { sort: '-created_date', limit: 40 });
      const questions = items
        .map((q) => `- "${q.query_text}"${q.city ? ` (city: ${q.city})` : ''} [source: ${q.source}, ${q.platform || 'unknown'}]`)
        .join('\n') || '(no queries logged yet — propose evergreen ideas for the business instead)';

      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the content co-creator for ${BIZ_FACTS}\n\nBelow are real, recent questions people asked (site chat with our AI receptionist, web-wide service hunts, Google Search keywords). Cluster them into 5 distinct, high-value content ideas the business should create next. For each: a compelling title, the format ("blog post", "site section" or "social post"), the angle (2-3 sentences on what it covers and how it wins the customer), and "why" (which real questions/demand it answers). Prefer ideas tied to the actual questions below; only fill gaps with evergreen ideas. Vary the formats.\n\nRecent questions:\n${questions}`,
        response_json_schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  format: { type: 'string' },
                  angle: { type: 'string' },
                  why: { type: 'string' }
                },
                required: ['title', 'format', 'angle', 'why']
              }
            }
          },
          required: ['ideas']
        }
      });
      return Response.json({ ideas: res.ideas || [] });
    }

    if (action === 'draft') {
      const topic = String(body.topic || '').trim().slice(0, 300);
      if (!topic) return Response.json({ error: 'Missing topic' }, { status: 400 });

      const gen = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_flash',
        add_context_from_internet: true,
        prompt: `You are the content co-creator for ${BIZ_FACTS}\n\nTopic: "${topic}".\n\nUsing current web research where useful, write a complete content package:\n1. blog_title: an SEO-friendly title (include the service/city keyword naturally).\n2. blog_body: a 400-550 word blog article in markdown, written for local customers, with an intro, 3-4 subheadings, and a closing call to action mentioning the phone number (604) 849-1745 and booking online. Never invent specific prices beyond the known pricing model.\n3. social_caption: a Facebook caption under 700 characters, warm and local, ending with the phone number and samedayrecycling.ca plus 2-3 local hashtags.\n4. site_headline: a punchy 5-9 word headline for a new homepage section on this topic.\n5. site_body: 2 sentences of supporting copy for that section.\n6. site_cta: a 2-4 word button label.`,
        response_json_schema: {
          type: 'object',
          properties: {
            blog_title: { type: 'string' },
            blog_body: { type: 'string' },
            social_caption: { type: 'string' },
            site_headline: { type: 'string' },
            site_body: { type: 'string' },
            site_cta: { type: 'string' }
          },
          required: ['blog_title', 'blog_body', 'social_caption', 'site_headline', 'site_body', 'site_cta']
        }
      });

      const slug = gen.blog_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || ('post-' + Date.now());
      const today = new Date().toISOString().slice(0, 10);
      const excerpt = String(gen.blog_body).replace(/[#*\n]/g, ' ').trim().slice(0, 180);

      const post = await base44.entities.ContentPost.create({
        title: gen.blog_title,
        slug,
        topic,
        excerpt,
        body: gen.blog_body,
        status: 'draft',
        generated_date: today
      });

      const draft = await base44.entities.CoCreatorDraft.create({
        topic,
        idea: String(body.idea || '').slice(0, 500),
        blog_title: gen.blog_title,
        blog_post_id: post.id,
        blog_slug: slug,
        blog_body: gen.blog_body,
        social_caption: gen.social_caption,
        site_headline: gen.site_headline,
        site_body: gen.site_body,
        site_cta: gen.site_cta,
        status: 'draft',
        description: `AI co-creator draft for "${topic}" (${today})`
      });

      return Response.json({ draft });
    }

    if (action === 'publish') {
      const id = String(body.id || '');
      if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
      const draft = await base44.entities.CoCreatorDraft.get(id);
      if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });
      if (draft.blog_post_id) {
        await base44.entities.ContentPost.update(draft.blog_post_id, { status: 'published' });
      }
      await base44.entities.CoCreatorDraft.update(id, { status: 'published' });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}