import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CATEGORY_CHANNELS = {
  business_intelligence: 'ai_academy',
  recycling_knowledge: 'recycling_exchange',
  homeowner_advice: 'general',
  industry_insights: 'general',
};

const CATEGORY_BRIEF = {
  business_intelligence: 'Business Intelligence for independent junk removal and recycling contractors in Canada: pricing and profitability, customer acquisition, cash flow, contractor operations, or business administration.',
  recycling_knowledge: 'Recycling Knowledge for Canadians: material sorting, reuse opportunities, waste reduction, Canadian recycling practices, or disposal considerations.',
  homeowner_advice: 'Homeowner Advice: preparing for junk removal, furniture disposal options, donation alternatives, renovation cleanup, or moving and decluttering.',
  industry_insights: 'Canadian Industry Insights: relevant market trends, regional business opportunities, seasonal service considerations, or publicly available industry developments.',
};

// One scheduled publish per day; the kind rotates through the week so the
// calendar mixes how-tos, discussion prompts, a weekly insight and a feature.
// Index = getUTCDay(): 0 Sun feature, Mon question, Tue educational,
// Wed question, Thu educational, Fri insight, Sat question.
const DAY_KINDS = ['feature', 'question', 'educational', 'question', 'educational', 'insight', 'question'];

const KIND_INSTRUCTIONS = {
  educational: 'An educational how-to post: 150-260 words, short paragraphs, immediately practical.',
  question: 'An official discussion prompt. The title is a genuine open question (max 90 characters). The body (60-110 words) sets context and invites members to share their real experience. Never simulate replies.',
  insight: 'A weekly business insight: one practical operating principle a contractor can apply this week, 150-260 words.',
  feature: 'A weekly recycling or sustainability feature: a reuse, donation or waste-reduction angle, 150-260 words.',
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const sr = base44.asServiceRole;
    const settings = (await sr.entities.CommunityPublisherSettings.filter({}, { limit: 1 })).items?.[0]
      || { paused: false, auto_publish: false, generate_images: false, queue_max: 3 };

    if (body?.action === 'suggest') {
      const llm = await sr.integrations.Core.InvokeLLM({
        prompt: await suggestPrompt(sr),
        response_json_schema: {
          type: 'object',
          properties: { ideas: { type: 'array', items: { type: 'object', properties: { topic: { type: 'string' }, why: { type: 'string' } }, required: ['topic'] } } },
          required: ['ideas'],
        },
      });
      return Response.json({ ideas: (llm && llm.ideas) || [] });
    }

    if (body?.action === 'generate') {
      const draft = await generateDraft(sr, { topic: body.topic, kind: body.kind });
      return Response.json({ draft });
    }

    if (body?.action === 'publish_draft') {
      return Response.json(await publishDraft(sr, body.draft_id, settings));
    }

    if (body?.action === 'decline') {
      const draft = await sr.entities.CommunityDraft.get(body.draft_id);
      if (!draft) return Response.json({ error: 'draft_not_found' }, { status: 404 });
      await sr.entities.CommunityDraft.update(body.draft_id, {
        status: 'declined',
        review_note: String(body.note || '').slice(0, 1000),
        history: [...(draft.history || []), { date: new Date().toISOString(), event: 'declined', note: String(body.note || '') }],
      });
      return Response.json({ declined: true });
    }

    // Scheduled run
    if (settings.paused) return Response.json({ status: 'paused' });
    const pending = await sr.entities.CommunityDraft.count({ status: 'pending_review' });
    if (pending >= (settings.queue_max || 3)) return Response.json({ status: 'queue_full', pending });
    const draft = await generateDraft(sr, {});
    let published = false;
    if (settings.auto_publish) {
      await publishDraft(sr, draft.id, settings);
      published = true;
    }
    return Response.json({ status: 'generated', title: draft.title, kind: draft.kind, published });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function generateDraft(sr, { topic, kind } = {}) {
  const existing = (await sr.entities.CommunityDraft.filter({}, { sort: '-created_date', limit: 25 })).items || [];
  const recent = (await sr.entities.CommunityPost.filter({ ai_generated: true }, { sort: '-created_date', limit: 25 })).items || [];
  const recentTitles = [...existing.map((d) => d.title), ...recent.map((p) => p.title)].filter(Boolean);

  const today = new Date().getUTCDay();
  const chosenKind = KIND_INSTRUCTIONS[kind] ? kind : DAY_KINDS[today];
  const cats = Object.keys(CATEGORY_BRIEF);
  const fallbackCategory = cats[existing.length % cats.length];

  const llm = await sr.integrations.Core.InvokeLLM({
    prompt: [
      'You are Recycling OS Intelligence, the official AI knowledge publisher for the Recycling OS Community on samedayrecycling.ca, a professional community for Canadian junk removal operators, recycling businesses, and homeowners.',
      'Write ONE community post as JSON.',
      `Content category: ${CATEGORY_BRIEF[fallbackCategory]}`,
      `Post kind: ${KIND_INSTRUCTIONS[chosenKind]}`,
      topic ? `Write about this topic: ${topic}` : 'Choose a genuinely useful topic in this category that has not been covered recently.',
      `Recently covered titles (do not repeat or closely paraphrase any of them): ${recentTitles.join(' | ') || 'none'}`,
      'Rules:',
      '- Never invent statistics, survey numbers, regulations, laws, market figures, news events, or named companies or programs.',
      '- State only well-established, general guidance. Where local rules vary (for example what a municipality accepts curbside), tell readers to check their own municipality or program.',
      '- Plain, practical, professional tone. Canadian spelling.',
      '- source_note: if the body makes factual claims about regulations, programs or market facts, describe the type of official source a reader should verify with (max 200 characters, e.g. "Verify accepted materials with your municipal recycling program"). If the post contains no such claims, return an empty string.',
    ].join('\n'),
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        category: { type: 'string', enum: cats },
        source_note: { type: 'string' },
      },
      required: ['title', 'body', 'category'],
    },
  });

  const out = llm || {};
  const category = CATEGORY_BRIEF[out.category] ? out.category : fallbackCategory;
  return await sr.entities.CommunityDraft.create({
    title: String(out.title || '').slice(0, 200),
    body: String(out.body || ''),
    category,
    kind: chosenKind,
    channel: CATEGORY_CHANNELS[category] || 'general',
    source_note: String(out.source_note || '').slice(0, 300),
    status: 'pending_review',
    history: [{ date: new Date().toISOString(), event: 'generated', note: topic ? 'From owner topic suggestion' : `Scheduled ${chosenKind} run` }],
  });
}

async function publishDraft(sr, draftId, settings) {
  const draft = await sr.entities.CommunityDraft.get(draftId);
  if (!draft) return { error: 'draft_not_found' };
  let image_url = draft.image_url || '';
  if (!image_url && settings?.generate_images) {
    try {
      const img = await sr.integrations.Core.GenerateImage({
        prompt: `Clean modern editorial photo illustrating: ${draft.title}. Warm neutral tones with emerald green accents, professional lifestyle photography, no text, no people.`,
      });
      image_url = img?.url || '';
    } catch { /* keep text-only */ }
  }
  const post = await sr.entities.CommunityPost.create({
    channel: draft.channel,
    province: 'national',
    title: draft.title,
    body: draft.body,
    image_url,
    status: 'published',
    author_name: 'Recycling OS Intelligence',
    ai_generated: true,
    ai_kind: draft.kind === 'question' ? 'question' : 'post',
    source_note: draft.source_note || '',
  });
  await sr.entities.CommunityDraft.update(draftId, {
    status: 'published',
    post_id: post.id,
    history: [...(draft.history || []), { date: new Date().toISOString(), event: 'published', note: `Post ${post.id}` }],
  });
  return { published: true, post_id: post.id };
}

async function suggestPrompt(sr) {
  const recent = (await sr.entities.CommunityPost.filter({ ai_generated: true }, { sort: '-created_date', limit: 20 })).items || [];
  return [
    'Suggest 5 distinct topic ideas for Recycling OS Intelligence, the AI knowledge publisher of the Recycling OS Community (Canadian junk removal and recycling professionals).',
    'Categories: business intelligence (pricing, cash flow, operations), recycling knowledge (sorting, reuse, Canadian practices), homeowner advice (preparation, donation, decluttering), industry insights (seasonal and regional considerations).',
    `Avoid these recently covered titles: ${recent.map((p) => p.title).join(' | ') || 'none'}`,
    'Rules: practical and useful for readers; never propose topics that would require invented statistics, news, or regulations.',
  ].join('\n');
}