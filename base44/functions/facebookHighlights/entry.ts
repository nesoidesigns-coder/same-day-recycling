import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getFacebookPage } from '../../shared/facebook.ts';

const GRAPH = "https://graph.facebook.com/v25.0";

// Public: returns the page's latest posts (public page data only) for the homepage.
// Note: likes/comments summary fields require Page Public Content Access (denied),
// so we fetch shares + full_picture only — both available with pages_read_engagement.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { pageId, pageToken, pageName, fanCount, followersCount } = await getFacebookPage(base44);
    const res = await fetch(
      `${GRAPH}/${pageId}/posts?fields=id,message,created_time,shares,full_picture&limit=6`,
      { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const posts = (data.data || [])
      .filter((p) => p.message)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        message: p.message,
        created_time: p.created_time,
        image: p.full_picture || null,
        shares: (p.shares && p.shares.count) || 0,
      }));
    return Response.json({
      page_name: pageName,
      followers: followersCount ?? fanCount,
      posts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}