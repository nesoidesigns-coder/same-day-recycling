import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const topic = String(payload.topic || '').trim().slice(0, 300);

    const { items: existing } = await base44.asServiceRole.entities.ContentPost.list({ fields: ['title'], limit: 100 });
    const existingTitles = existing.map((p) => p.title).join(' | ') || 'none yet';

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the content writer for Same Day Recycling (samedayrecycling.ca), a same-day junk removal and recycling service in British Columbia, Canada, serving Vancouver, Burnaby, Richmond, Surrey, Coquitlam, Kamloops and Kelowna.\n\n' +
        'Articles already on the blog (do NOT repeat these topics): ' + existingTitles + '\n\n' +
        (topic
          ? 'Write an article about: "' + topic + '"'
          : 'Pick a fresh, genuinely useful topic for homeowners, realtors, property managers or contractors in BC that is not already covered.') +
        '\n\nResearch current facts on the web first (BC and Canada specific: bylaws, disposal rules, recycling programs, prices in CAD, seasonal advice). ' +
        'Then write an original article of 500-700 words in clean markdown: one H1-style title, H2/H3 subheadings, short paragraphs, and bullet lists where helpful. ' +
        'End with one short practical paragraph and mention that Same Day Recycling offers same-day pickup (no heavy sales pitch, at most one soft mention).',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          excerpt: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['title', 'excerpt', 'body'],
      },
    });

    if (!ai || !ai.title || !ai.body) {
      return Response.json({ error: 'Generation failed' }, { status: 502 });
    }

    const post = await base44.asServiceRole.entities.ContentPost.create({
      title: String(ai.title).slice(0, 200),
      slug: slugify(ai.title),
      topic: topic || '',
      excerpt: String(ai.excerpt || '').slice(0, 200),
      body: String(ai.body),
      status: 'draft',
      generated_date: new Date().toISOString().slice(0, 10),
    });

    return Response.json({ ok: true, id: post.id, title: post.title, slug: post.slug, status: post.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}