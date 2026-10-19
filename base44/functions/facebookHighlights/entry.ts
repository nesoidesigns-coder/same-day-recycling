import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getFacebookPage } from '../../shared/facebook.ts';

const GRAPH = "https://graph.facebook.com/v25.0";

// Public: returns the page's latest posts (public page data only) for the homepage.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { pageId, pageToken, pageName, fanCount, followersCount } = await getFacebookPage(base44);
    const res = await fetch(
      `${GRAPH}/${pageId}/posts?fields=id,message,created_time,shares,likes.summary(true),comments.summary(true)&limit=6`,
      { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const posts = (data.data || [])
      .map((p) => ({
        id: p.id,
        message: p.message || '',
        created_time: p.created_time,
        likes: (p.likes && p.likes.summary && p.likes.summary.total_count) || 0,
        comments: (p.comments && p.comments.summary && p.comments.summary.total_count) || 0,
        shares: (p.shares && p.shares.count) || 0,
      }))
      .filter((p) => p.message)
      .slice(0, 3);
    return Response.json({
      page_name: pageName,
      followers: followersCount ?? fanCount,
      posts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}