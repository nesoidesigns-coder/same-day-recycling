import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Pulls live TikTok insights for the connected @samedayrecycling account via
// the TikTok OAuth connector: profile stats (followers, likes, video count)
// and per-video performance. Read-only - TikTok's connection does not support
// publishing or editing. Admin-only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('tiktok');

    // Profile + stats
    const profileRes = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url,follower_count,following_count,likes_count,video_count,is_verified',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const profileData = await profileRes.json();
    const profile = profileData?.data?.user || null;

    // Public videos + stats
    let videos = [];
    try {
      const videoRes = await fetch(
        'https://open.tiktokapis.com/v2/video/list/?fields=id,title,create_time,like_count,comment_count,share_count,view_count,embed_link',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ max_count: 20 }),
        }
      );
      const videoData = await videoRes.json();
      videos = (videoData?.data?.videos || []).map((v) => ({
        id: v.id,
        title: v.title || '',
        posted: v.create_time ? new Date(v.create_time * 1000).toISOString().slice(0, 10) : '',
        views: v.view_count || 0,
        likes: v.like_count || 0,
        comments: v.comment_count || 0,
        shares: v.share_count || 0,
        link: v.embed_link || '',
      })).sort((a, b) => b.views - a.views);
    } catch {}

    const totals = videos.reduce(
      (acc, v) => ({ views: acc.views + v.views, likes: acc.likes + v.likes, comments: acc.comments + v.comments, shares: acc.shares + v.shares }),
      { views: 0, likes: 0, comments: 0, shares: 0 }
    );

    return Response.json({
      ok: true,
      profile,
      totals,
      top_videos: videos.slice(0, 10),
      video_count_returned: videos.length,
      note: 'Read-only insights. TikTok does not allow publishing through this connection - posts are made in the TikTok app.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}