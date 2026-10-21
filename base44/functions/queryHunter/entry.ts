import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const today = new Date().toISOString().slice(0, 10);

    const body = await req.json().catch(() => ({}));
    const sendDigest = body.send_digest === true;

    const [aiRes, kwRes] = await Promise.allSettled([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          'You are a lead-hunting scout for Same Day Recycling (samedayrecycling.ca), a same-day junk removal, furniture removal, appliance removal, estate cleanout and FREE metal pickup service in Canada, serving major Canadian cities.\n\n' +
          'Search the live web for REAL, recent posts where people in these cities are ASKING about or looking for these services: Reddit (city and regional subreddits across Canada), Kijiji and Craigslist job boards, Facebook community groups, local forums, Nextdoor, question sites. ' +
          'Look for people asking where to dump a sofa, who picks up junk today, appliance disposal, mattress removal, garage cleanout help, scrap metal pickup, etc.\n\n' +
          'Return up to 10 real, specific queries found. For each give: query_text (what they asked, close to verbatim), platform (e.g. "Reddit r/toronto", "Kijiji", "Facebook group: [name]"), city, service (junk removal / furniture / appliance / metal / cleanout / other), asker_or_url (username or link), intent (what they want and how hot a lead they are, under 25 words). ' +
          'If you cannot find enough real recent posts, return fewer. NEVER invent posts, usernames or links.',
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            queries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  query_text: { type: 'string' },
                  platform: { type: 'string' },
                  city: { type: 'string' },
                  service: { type: 'string' },
                  asker_or_url: { type: 'string' },
                  intent: { type: 'string' },
                },
                required: ['query_text'],
              },
            },
          },
          required: ['queries'],
        },
      }),
      base44.functions.invoke('searchConsoleKeywords', {}),
    ]);

    const webQueries = aiRes.status === 'fulfilled' ? (aiRes.value && aiRes.value.queries) || [] : [];
    const kwRaw = kwRes.status === 'fulfilled' ? kwRes.value : null;
    const keywords = (kwRaw && (kwRaw.keywords || (kwRaw.data && kwRaw.data.keywords))) || [];

    const existingRes = await base44.asServiceRole.entities.ServiceQuery.filter({}, { limit: 1000, fields: ['query_text', 'source'] });
    const seen = new Set(
      existingRes.items.map((q) => (q.source || '') + '::' + String(q.query_text || '').toLowerCase().trim()),
    );

    const fresh = [];
    for (const q of webQueries.slice(0, 12)) {
      const text = String(q.query_text || '').trim().slice(0, 300);
      if (!text) continue;
      const key = 'web_hunt::' + text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      fresh.push({
        query_text: text,
        source: 'web_hunt',
        platform: String(q.platform || '').slice(0, 60),
        city: String(q.city || '').slice(0, 40),
        service: String(q.service || '').slice(0, 60),
        asker_or_url: String(q.asker_or_url || '').slice(0, 300),
        intent: String(q.intent || '').slice(0, 300),
        captured_date: today,
      });
    }
    for (const k of keywords.slice(0, 20)) {
      const text = String(k.query || '').trim().slice(0, 300);
      if (!text) continue;
      const key = 'search_console::' + text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      fresh.push({
        query_text: text,
        source: 'search_console',
        platform: 'Google',
        city: '',
        service: '',
        asker_or_url: String(k.page || '').slice(0, 300),
        intent: 'Position ' + (k.position || '?') + ', ' + (k.impressions || 0) + ' impressions, ' + (k.clicks || 0) + ' clicks',
        captured_date: today,
      });
    }

    let saved = 0;
    if (fresh.length) {
      const created = await base44.asServiceRole.entities.ServiceQuery.bulkCreate(fresh);
      saved = (created && created.length) || 0;
    }

    const list = fresh.slice(0, 15).map((q) =>
      '[' + (q.source === 'web_hunt' ? 'Web' : 'Google') + ']' +
      (q.city ? ' ' + q.city : '') +
      ' "' + q.query_text + '"' +
      (q.platform ? ' via ' + q.platform : ''),
    );

    const queryList = list.length ? list.join(' \u2022 ') : 'No new queries this run. Your service coverage already matches what people are asking.';

    let email_sent = false;
    if (sendDigest) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: 'nesoidesigns@gmail.com',
        template_name: 'ServiceQueryDigest',
        variables: { new_count: String(saved), query_list: queryList },
      });
      email_sent = true;
    }

    return Response.json({
      ok: true,
      saved_new: saved,
      web_found: webQueries.length,
      keywords_found: keywords.length,
      query_list: queryList,
      email_sent,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}