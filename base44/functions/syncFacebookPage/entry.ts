import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { getFacebookPage } from '../../shared/facebook.ts';

// Syncs the connected Facebook Page's id and name into FacebookSettings so the
// AI receptionist and admin dashboard can see the live page connection.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;

    const { pageId, pageName } = await getFacebookPage(base44);

    const settingsPage = await svc.entities.FacebookSettings.list();
    const existing = (settingsPage.items || [])[0];
    if (existing) {
      await svc.entities.FacebookSettings.update(existing.id, { page_id: pageId, page_name: pageName });
    } else {
      await svc.entities.FacebookSettings.create({ page_id: pageId, page_name: pageName });
    }

    return Response.json({ ok: true, page_id: pageId, page_name: pageName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}