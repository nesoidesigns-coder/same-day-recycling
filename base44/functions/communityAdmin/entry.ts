import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => (Number(v) || 0);
const items = (r) => (r && r.items ? r.items : Array.isArray(r) ? r : []);

// Owner-only community command center: metrics (actual data only), moderation
// queues, member verification, knowledge-library publishing and AI insights.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'metrics';

    if (action === 'metrics') {
      const [profiles, posts, comments, opportunities, reports, resources, licenses, partners, commentAuthors, postAuthors] = await Promise.all([
        base44.asServiceRole.entities.CommunityProfile.list({ limit: 500 }),
        base44.asServiceRole.entities.CommunityPost.list({ limit: 1000, sort: '-created_date' }),
        base44.asServiceRole.entities.CommunityComment.count({}),
        base44.asServiceRole.entities.CommunityOpportunity.count({ status: 'open' }),
        base44.asServiceRole.entities.CommunityReport.count({ status: 'open' }),
        base44.asServiceRole.entities.CommunityResource.list({ limit: 500 }),
        base44.asServiceRole.entities.SoftwareLicense.list({ limit: 500 }),
        base44.asServiceRole.entities.Partner.list({ limit: 500 }),
        base44.asServiceRole.entities.CommunityComment.list({ distinct: 'created_by' }),
        base44.asServiceRole.entities.CommunityPost.list({ distinct: 'created_by' }),
      ]);
      const profileRows = items(profiles).filter((p) => !p.suspended);
      const postRows = items(posts).filter((p) => p.status !== 'removed');
      const emails = new Set([...items(commentAuthors), ...items(postAuthors)].map((e) => String(e || '').toLowerCase()).filter(Boolean));
      const softwareEmails = new Set([...items(licenses), ...items(partners)].map((r) => String(r.email || '').toLowerCase()).filter(Boolean));
      let conversions = 0;
      for (const e of emails) if (softwareEmails.has(e)) conversions += 1;
      const answeredPostIds = new Set(postRows.filter((p) => num(p.reply_count || 0) > 0).map((p) => p.id));
      return Response.json({
        metrics: {
          members_total: profileRows.length,
          members_verified: profileRows.filter((p) => p.verification_status === 'verified').length,
          verifications_pending: profileRows.filter((p) => p.verification_status === 'pending').length,
          suspended: items(profiles).length - profileRows.length,
          discussions_total: postRows.length,
          by_channel: CHANNEL_COUNTS(postRows),
          questions_answered: answeredPostIds.size,
          comments_total: num(comments),
          active_participants: emails.size,
          opportunities_open: num(opportunities),
          reports_open: num(reports),
          resources_published: items(resources).filter((r) => r.status === 'published').length,
          resources_pending_review: items(resources).filter((r) => r.status === 'pending_review').length,
          member_to_software_conversions: conversions,
        },
        data_note: 'All figures are actual record counts — nothing here is an estimate.',
      });
    }

    if (action === 'members') {
      const page = await base44.asServiceRole.entities.CommunityProfile.list({ limit: 500, sort: '-created_date' });
      return Response.json({ members: items(page).map((p) => ({
        id: p.id, display_name: p.display_name, member_type: p.member_type, business_name: p.business_name,
        city: p.city, province_code: p.province_code, verification_status: p.verification_status,
        verification_note: p.verification_note || '', verified_details: p.verified_details || '',
        contribution_score: num(p.contribution_score), suspended: !!p.suspended, email: p.created_by,
      })) });
    }

    if (action === 'queue') {
      const [reports, flaggedPosts, pendingResources] = await Promise.all([
        base44.asServiceRole.entities.CommunityReport.filter({ status: 'open' }, { limit: 100, sort: '-created_date' }),
        base44.asServiceRole.entities.CommunityPost.filter({ status: 'pending_review' }, { limit: 100, sort: '-created_date' }),
        base44.asServiceRole.entities.CommunityResource.filter({ status: 'pending_review' }, { limit: 100, sort: '-created_date' }),
      ]);
      return Response.json({
        reports: items(reports),
        flagged_posts: items(flaggedPosts),
        pending_resources: items(pendingResources),
      });
    }

    if (action === 'resolve_report') {
      const id = String(body?.report_id || '');
      const status = ['reviewed', 'actioned', 'dismissed'].includes(body?.status) ? body.status : 'reviewed';
      if (!id) return Response.json({ error: 'report_id required' }, { status: 400 });
      await base44.asServiceRole.entities.CommunityReport.update(id, {
        status,
        resolution_note: String(body?.note || '').slice(0, 1000),
      });
      return Response.json({ ok: true });
    }

    if (action === 'remove_post' || action === 'restore_post') {
      const id = String(body?.post_id || '');
      if (!id) return Response.json({ error: 'post_id required' }, { status: 400 });
      const post = await base44.asServiceRole.entities.CommunityPost.get(id);
      if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });
      await base44.asServiceRole.entities.CommunityPost.update(id, { status: action === 'remove_post' ? 'removed' : 'published' });
      return Response.json({ ok: true });
    }

    if (action === 'suspend_member' || action === 'reinstate_member') {
      const id = String(body?.profile_id || '');
      if (!id) return Response.json({ error: 'profile_id required' }, { status: 400 });
      await base44.asServiceRole.entities.CommunityProfile.update(id, { suspended: action === 'suspend_member' });
      return Response.json({ ok: true });
    }

    if (action === 'verify_member') {
      const id = String(body?.profile_id || '');
      const decision = ['verified', 'declined', 'pending'].includes(body?.decision) ? body.decision : null;
      if (!id || !decision) return Response.json({ error: 'profile_id and decision required' }, { status: 400 });
      const patch = { verification_status: decision };
      if (body?.verified_details !== undefined) patch.verified_details = String(body.verified_details).slice(0, 1000);
      await base44.asServiceRole.entities.CommunityProfile.update(id, patch);
      return Response.json({ ok: true });
    }

    if (action === 'create_resource') {
      const title = String(body?.title || '').trim().slice(0, 200);
      const text = String(body?.body || '').trim().slice(0, 8000);
      if (!title || !text) return Response.json({ error: 'title and body required' }, { status: 400 });
      const rec = await base44.asServiceRole.entities.CommunityResource.create({
        title,
        body: text,
        category: ['starting_out', 'pricing', 'customer_service', 'recycling_practices', 'equipment_fleet', 'financial_management', 'administration', 'partnerships'].includes(body?.category) ? body.category : 'starting_out',
        source_post_id: String(body?.source_post_id || '').slice(0, 100),
        status: body?.publish_now === true ? 'published' : 'draft',
        review_note: String(body?.review_note || '').slice(0, 1000),
      });
      return Response.json({ ok: true, resource: rec });
    }

    if (action === 'publish_resource') {
      const id = String(body?.resource_id || '');
      if (!id) return Response.json({ error: 'resource_id required' }, { status: 400 });
      await base44.asServiceRole.entities.CommunityResource.update(id, {
        status: 'published',
        review_note: String(body?.review_note || '').slice(0, 1000),
      });
      return Response.json({ ok: true });
    }

    if (action === 'insights') {
      const [posts, comments, profiles, opportunities] = await Promise.all([
        base44.asServiceRole.entities.CommunityPost.filter({ status: 'published' }, { limit: 300, sort: '-created_date' }),
        base44.asServiceRole.entities.CommunityComment.filter({ status: 'published' }, { limit: 500, sort: '-created_date' }),
        base44.asServiceRole.entities.CommunityProfile.list({ limit: 500 }),
        base44.asServiceRole.entities.CommunityOpportunity.list({ limit: 200, sort: '-created_date' }),
      ]);
      const postRows = items(posts);
      const commentRows = items(comments);
      const commentByPost = {};
      for (const c of commentRows) commentByPost[c.post_id] = (commentByPost[c.post_id] || 0) + 1;
      const summary = {
        stats: {
          members: items(profiles).length,
          discussions: postRows.length,
          comments: commentRows.length,
          opportunities: items(opportunities).length,
        },
        recent_discussions: postRows.slice(0, 60).map((p) => ({ title: p.title, channel: p.channel, replies: commentByPost[p.id] || 0 })),
        profile_mix: countBy(items(profiles).map((p) => p.member_type)),
      };
      const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          'You are the AI community insight assistant for the owner of a Canadian recycling/junk-removal professional community (free to join, optional paid software).\n' +
          'Analyze the community activity below and produce insights for the OWNER. Rules:\n' +
          '- Distinguish observed facts (cite counts/titles) from interpretations and estimates.\n' +
          '- Identify recurring member questions or themes from discussion titles.\n' +
          '- Suggest knowledge-library topics worth developing, and where the community needs a moderator\'s attention.\n' +
          '- Small samples are not trends: say so plainly when data is thin.\n' +
          '- Never invent member names, quotes or activity.\n\n' + JSON.stringify(summary),
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            recurring_questions: { type: 'array', items: { type: 'string' } },
            library_topics: { type: 'array', items: { type: 'string' } },
            moderation_attention: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } },
          },
          required: ['summary', 'recommendations'],
        },
      });
      return Response.json({
        insights: {
          summary: String(ai.summary || '').slice(0, 3000),
          recurring_questions: (ai.recurring_questions || []).slice(0, 8),
          library_topics: (ai.library_topics || []).slice(0, 8),
          moderation_attention: (ai.moderation_attention || []).slice(0, 6),
          recommendations: (ai.recommendations || []).slice(0, 8),
        },
        ai_note: 'AI-assisted interpretation over actual community records. Recommendations are advisory only — nothing is executed.',
      });
    }

    return Response.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function CHANNEL_COUNTS(postRows) {
  const counts = {};
  for (const p of postRows) counts[p.channel] = (counts[p.channel] || 0) + 1;
  return counts;
}

function countBy(arr) {
  const out = {};
  for (const v of arr) out[v] = (out[v] || 0) + 1;
  return out;
}