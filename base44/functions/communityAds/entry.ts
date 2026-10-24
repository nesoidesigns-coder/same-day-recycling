import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const CHANNELS = ['general', 'contractor_exchange', 'ai_academy', 'recycling_exchange', 'equipment_ops', 'provincial', 'ideas_feedback', 'announcements'];
const items = (r) => (r && r.items ? r.items : Array.isArray(r) ? r : []);

// Hybrid ad allocation. House and sponsored ads are scored against the feed
// context (channel + user-selected region) and returned in relevance order.
// The AdSense network is appended only when the owner has explicitly
// activated it. No advertisers, engagement or revenue are ever invented.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    if (body?.action === 'serve') {
      const channel = CHANNELS.includes(body?.channel) ? body.channel : 'general';
      const province = String(body?.province || '').slice(0, 20);
      const [adsPage, settingsPage] = await Promise.all([
        base44.asServiceRole.entities.CommunityAd.filter({ status: 'active' }, { limit: 50 }),
        base44.asServiceRole.entities.AdNetworkSettings.filter({ network: 'adsense' }, { limit: 1 }),
      ]);

      const matched = items(adsPage)
        .map((ad) => {
          const topics = Array.isArray(ad.topics) ? ad.topics : [];
          const provinces = Array.isArray(ad.provinces) ? ad.provinces : [];
          // Broadly relevant (no topics) scores mid; topic match scores high;
          // no topic match but generic relevance stays eligible at low score.
          const topicScore = topics.includes(channel) ? 2 : (topics.length ? 0.5 : 1);
          const geoScore = !provinces.length || provinces.includes(province) ? 1 : -5;
          const kindBoost = ad.ad_kind === 'sponsored' ? 0.25 : 0;
          return { ad, score: topicScore + geoScore + kindBoost };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((s) => ({
          id: s.ad.id,
          kind: s.ad.ad_kind === 'sponsored' ? 'sponsored' : 'house',
          advertiser_name: s.ad.ad_kind === 'sponsored' ? (s.ad.advertiser_name || '') : '',
          headline: s.ad.headline,
          body: s.ad.body || '',
          image_url: s.ad.image_url || '',
          cta_label: s.ad.cta_label || 'Learn more',
          link_url: s.ad.link_url,
        }));

      const settings = items(settingsPage)[0];
      if (settings?.status === 'active' && settings.publisher_id && settings.adsense_slot_id && matched.length < 3) {
        matched.push({ kind: 'adsense', publisher_id: settings.publisher_id, slot_id: settings.adsense_slot_id });
      }
      return Response.json({ ads: matched });
    }

    if (body?.action === 'track') {
      const id = String(body?.id || '');
      if (!id) return Response.json({ error: 'Missing ad id.' }, { status: 400 });
      const field = body?.event === 'click' ? 'clicks' : 'impressions';
      await base44.asServiceRole.entities.CommunityAd.updateMany({ id }, { $inc: { [field]: 1 } });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}