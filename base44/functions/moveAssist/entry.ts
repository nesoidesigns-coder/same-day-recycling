import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

// MoveAssist coordination: public project access is gated by a random
// reference code (the code is the check, per the public-lookup pattern).
// Rex intelligence uses InvokeLLM; its outputs are stored as planning
// advice and kept separate from verified customer facts.

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const makeCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
};

const clampText = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const cleanDate = (value) => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '');

const sanitizeItem = (raw) => ({
  item: clampText(raw?.item, 120),
  quantity: Math.max(1, Math.min(99, Number(raw?.quantity) || 1)),
  category: clampText(raw?.category, 60),
  note: clampText(raw?.note, 300),
  checked: raw?.checked === true,
});
const toInventory = (raw) => (Array.isArray(raw) ? raw.slice(0, 60).map(sanitizeItem) : []);

const sanitizeStage = (raw) => ({
  id: clampText(raw?.id, 40),
  label: clampText(raw?.label, 120),
  preferred_date: cleanDate(raw?.preferred_date),
  items_description: clampText(raw?.items_description, 1000),
  quote_estimate: clampText(raw?.quote_estimate, 60),
  quote_eighths: Math.max(0, Math.min(8, Number(raw?.quote_eighths) || 0)),
  quote_status: ['none', 'estimated', 'approved', 'declined'].includes(raw?.quote_status) ? raw.quote_status : 'none',
  status: ['draft', 'estimated', 'requested', 'scheduled', 'completed', 'cancelled'].includes(raw?.status) ? raw.status : 'draft',
  request_reference: clampText(raw?.request_reference, 12),
  dispatch_status: clampText(raw?.dispatch_status, 60),
  partner_name: clampText(raw?.partner_name, 120),
  booking_id: clampText(raw?.booking_id, 60),
  payment_status: clampText(raw?.payment_status, 40),
  completion_note: clampText(raw?.completion_note, 500),
});

const publicProject = (p) => ({
  reference_code: p.reference_code,
  name: p.name,
  email: p.email,
  phone: p.phone,
  move_date: p.move_date || '',
  move_flexible: p.move_flexible === true,
  situation: p.situation,
  property_type: p.property_type,
  city: p.city,
  province_code: p.province_code || '',
  address: p.address || '',
  postal_code: p.postal_code || '',
  pickup_lat: p.pickup_lat,
  pickup_lng: p.pickup_lng,
  pickup_unit: p.pickup_unit || '',
  pickup_location_source: p.pickup_location_source || '',
  access_instructions: p.access_instructions || {},
  inventory: p.inventory || [],
  photos: (p.photos || []).map((ph) => ({ label: ph.label || '', file_uri: ph.file_uri || '', added_date: ph.added_date || '' })),
  pickup_count: p.pickup_count || 'one',
  arrangement: p.arrangement || 'project',
  recommendation: p.recommendation || {},
  rex_timeline: p.rex_timeline || [],
  missing_info: p.missing_info || [],
  stages: p.stages || [],
  contractor_brief: p.contractor_brief || {},
  status: p.status || 'planning',
  status_history: p.status_history || [],
  consent_followups: p.consent_followups === true,
  created_date: p.created_date,
});

const findProject = async (base44, reference_code) => {
  const code = clampText(reference_code, 12).toUpperCase();
  if (!code) return null;
  const page = await base44.asServiceRole.entities.MoveAssistProject.filter({ reference_code: code }, { limit: 1 });
  const rows = Array.isArray(page) ? page : page.items || [];
  return rows[0] || null;
};

const logEvent = (project, event, note = '') => {
  const history = Array.isArray(project.status_history) ? [...project.status_history] : [];
  history.push({ date: new Date().toISOString(), event: clampText(event, 60), note: clampText(note, 300) });
  return history.slice(-50);
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'moveAssist', 20);
    if (!limited.allowed) return rateLimitedResponse();
    const body = await req.json();
    const action = clampText(body?.action, 20);

    // ---- create ----
    if (action === 'create') {
      const name = clampText(body?.name, 120).trim();
      const phone = clampText(body?.phone, 40).trim();
      const city = clampText(body?.city, 80).trim();
      if (name.length < 2 || phone.length < 7 || !city) {
        return Response.json({ error: 'Name, phone and city are required.' }, { status: 400 });
      }
      const lat = Number(body?.pickup_lat), lng = Number(body?.pickup_lng);
      const hasPin = Number.isFinite(lat) && Number.isFinite(lng) && lat >= 41 && lat <= 84 && lng >= -142 && lng <= -52;
      if (!hasPin) {
        return Response.json({ error: 'Confirm your pickup address on the map first.' }, { status: 400 });
      }
      const record = await base44.asServiceRole.entities.MoveAssistProject.create({
        name,
        phone,
        email: clampText(body?.email, 200),
        reference_code: makeCode(),
        move_date: cleanDate(body?.move_date),
        move_flexible: body?.move_flexible === true,
        situation: ['moving_out', 'moving_in', 'downsizing'].includes(body?.situation) ? body.situation : 'moving_out',
        property_type: ['apartment', 'condo', 'house', 'townhouse', 'other'].includes(body?.property_type) ? body.property_type : 'apartment',
        city,
        province_code: clampText(body?.province_code, 10),
        address: clampText(body?.address, 300),
        postal_code: clampText(body?.postal_code, 10),
        pickup_lat: lat,
        pickup_lng: lng,
        pickup_unit: clampText(body?.pickup_unit, 40),
        pickup_location_source: ['verified_geocode', 'customer_adjusted'].includes(body?.pickup_location_source) ? body.pickup_location_source : '',
        access_instructions: body?.access_instructions && typeof body.access_instructions === 'object' ? body.access_instructions : {},
        inventory: toInventory(body?.inventory),
        photos: Array.isArray(body?.photos) ? body.photos.slice(0, 12).map((p) => ({ label: clampText(p?.label, 120), file_uri: clampText(p?.file_uri, 300), added_date: new Date().toISOString() })) : [],
        pickup_count: ['one', 'several', 'unsure'].includes(body?.pickup_count) ? body.pickup_count : 'one',
        consent_followups: body?.consent_followups === true,
        status_history: [{ date: new Date().toISOString(), event: 'project_created', note: city }],
        record_type: body?.record_type === 'internal_test' ? 'internal_test' : 'service',
      });
      return Response.json({ ok: true, reference_code: record.reference_code });
    }

    // ---- get (public, code-gated) ----
    if (action === 'get') {
      const project = await findProject(base44, body?.reference_code);
      if (!project) return Response.json({ error: 'Project not found. Check your reference code.' }, { status: 404 });
      return Response.json({ project: publicProject(project) });
    }

    const project = await findProject(base44, body?.reference_code);
    if (!project) return Response.json({ error: 'Project not found. Check your reference code.' }, { status: 404 });

    // ---- update (customer, whitelisted fields) ----
    if (action === 'update') {
      const changes = body?.changes && typeof body.changes === 'object' ? body.changes : {};
      const patch = {};
      if (Array.isArray(changes.inventory)) patch.inventory = toInventory(changes.inventory);
      if (changes.access_instructions && typeof changes.access_instructions === 'object') patch.access_instructions = changes.access_instructions;
      if (cleanDate(changes.move_date) || changes.move_flexible === true || changes.move_flexible === false) {
        patch.move_date = cleanDate(changes.move_date);
        if (changes.move_flexible === true || changes.move_flexible === false) patch.move_flexible = changes.move_flexible;
      }
      if (changes.consent_followups === true || changes.consent_followups === false) patch.consent_followups = changes.consent_followups;
      if (Array.isArray(changes.stages)) patch.stages = changes.stages.slice(0, 12).map(sanitizeStage);
      if (['one_time', 'project', 'membership'].includes(changes.arrangement)) patch.arrangement = changes.arrangement;
      if (!Object.keys(patch).length) return Response.json({ error: 'Nothing to update.' }, { status: 400 });
      patch.status_history = logEvent(project, 'project_updated', Object.keys(patch).join(','));
      const updated = await base44.asServiceRole.entities.MoveAssistProject.update(project.id, patch);
      return Response.json({ ok: true, project: publicProject(updated) });
    }

    // ---- advise: Rex timeline, missing info, arrangement recommendation ----
    if (action === 'advise') {
      const facts = {
        move_date: project.move_date || 'flexible or unknown',
        situation: project.situation,
        property_type: project.property_type,
        city: project.city,
        pickup_count: project.pickup_count,
        items: (project.inventory || []).map((i) => `${i.quantity} x ${i.item}`).join('; ') || clampText(body?.items_text, 800),
        access: project.access_instructions || {},
      };
      const advice = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'You are Rex, the MoveAssist coordinator for a Canadian junk-removal and recycling platform that coordinates independent contractors (it does not perform removals itself). A customer is preparing unwanted-item removal around a move. Customer-provided facts: ' + JSON.stringify(facts) + '. Produce: (1) a moving cleanout timeline with 2-6 stage suggestions (label, timing relative to the move, what each pickup covers); (2) the most important missing information the customer still needs to provide (max 5, plain language); (3) an arrangement recommendation that must be "one_time" when a single pickup covers everything, otherwise "project"; never recommend a paid membership. Keep every statement practical and warm. These are planning suggestions, not confirmed availability, prices or appointments.',
        response_json_schema: {
          type: 'object',
          properties: {
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: { when: { type: 'string' }, what: { type: 'string' }, stage_label: { type: 'string' }, stage_timing: { type: 'string' } },
                required: ['when', 'what'],
              },
            },
            missing_info: { type: 'array', items: { type: 'string' } },
            recommendation: {
              type: 'object',
              properties: { arrangement: { type: 'string', enum: ['one_time', 'project'] }, reason: { type: 'string' } },
              required: ['arrangement', 'reason'],
            },
          },
          required: ['timeline', 'missing_info', 'recommendation'],
        },
      });
      const recommended = advice?.recommendation?.arrangement === 'one_time' && (project.pickup_count || 'one') === 'one' ? 'one_time' : 'project';
      const timeline = (advice?.timeline || []).slice(0, 6).map((t, index) => ({
        when: clampText(t.when, 120),
        what: clampText(t.what, 300),
        stage_id: '',
      }));
      let stages = project.stages || [];
      if (!stages.length) {
        stages = (advice?.timeline || []).slice(0, 4).map((t, index) => sanitizeStage({
          id: crypto.randomUUID().slice(0, 8),
          label: clampText(t.stage_label || `Pickup ${index + 1}`, 120),
          preferred_date: '',
          items_description: clampText(t.what, 1000),
          status: 'draft',
        }));
      }
      const updated = await base44.asServiceRole.entities.MoveAssistProject.update(project.id, {
        rex_timeline: timeline,
        missing_info: (advice?.missing_info || []).slice(0, 5).map((m) => clampText(m, 200)),
        recommendation: { arrangement: recommended, reason: clampText(advice?.recommendation?.reason, 500), basis: 'ai_planning_estimate' },
        arrangement: recommended,
        stages,
        status_history: logEvent(project, 'rex_advised', recommended),
      });
      return Response.json({ ok: true, project: publicProject(updated) });
    }

    // ---- inventory: photo review by Rex ----
    if (action === 'inventory') {
      const uris = Array.isArray(body?.file_uris) ? body.file_uris.filter((u) => typeof u === 'string' && u.length < 300).slice(0, 4) : [];
      if (!uris.length) return Response.json({ error: 'No photos provided.' }, { status: 400 });
      const signed = [];
      for (const uri of uris) {
        try {
          const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
          if (signed_url) signed.push(signed_url);
        } catch { /* skip unreadable photo */ }
      }
      if (!signed.length) return Response.json({ error: 'Photos could not be opened.' }, { status: 400 });
      const vision = await base44.asServiceRole.integrations.Core.InvokeLLM({
        file_urls: signed,
        prompt: 'A customer moving out of a Canadian home photographed items they want removed. Identify the removal items and estimate quantity. Only list what is visibly present; never infer property condition, access or anything not in the photos. Respond as an item inventory.',
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: { item: { type: 'string' }, quantity: { type: 'number' }, category: { type: 'string' } },
                required: ['item', 'quantity'],
              },
            },
          },
          required: ['items'],
        },
      });
      const found = (vision?.items || []).slice(0, 30).map((i) => sanitizeItem({ item: i.item, quantity: i.quantity, category: i.category }));
      const existing = toInventory(project.inventory);
      const merged = [...existing];
      for (const item of found) {
        if (!merged.some((m) => m.item.toLowerCase() === item.item.toLowerCase())) merged.push(item);
      }
      const photos = (project.photos || []).concat(uris.filter((uri) => !(project.photos || []).some((p) => p.file_uri === uri)).map((uri) => ({ label: 'Customer photo', file_uri: uri, added_date: new Date().toISOString() })));
      const updated = await base44.asServiceRole.entities.MoveAssistProject.update(project.id, {
        inventory: merged,
        photos,
        status_history: logEvent(project, 'photos_reviewed', `${found.length} items identified`),
      });
      return Response.json({ ok: true, items: found, project: publicProject(updated) });
    }

    // ---- brief: contractor-ready job package for one stage ----
    if (action === 'brief') {
      const stage = (project.stages || []).find((s) => s.id === clampText(body?.stage_id, 40));
      if (!stage) return Response.json({ error: 'Stage not found.' }, { status: 404 });
      const brief = {
        stage_id: stage.id,
        label: stage.label,
        verified_location: {
          address: project.address,
          unit: project.pickup_unit,
          city: project.city,
          province_code: project.province_code,
          coordinates: Number.isFinite(project.pickup_lat) ? { lat: project.pickup_lat, lng: project.pickup_lng } : null,
          location_source: project.pickup_location_source,
        },
        item_inventory: (project.inventory || []).map((i) => ({ item: i.item, quantity: i.quantity })),
        photographs_count: (project.photos || []).length,
        access_details: project.access_instructions || {},
        requested_window: stage.preferred_date || 'customer to confirm',
        approved_estimate: stage.quote_status === 'approved' ? stage.quote_estimate : null,
        known_risks: [],
        customer_contact: { name: project.name, phone: project.phone, email: project.email },
        completion_requirements: 'Record loaded materials, disposal outcome and completion time in the job record; customer approval is required for any additional items before they are loaded.',
        prepared_by: 'rex_moveassist',
        prepared_at: new Date().toISOString(),
      };
      const risk = [];
      const access = project.access_instructions || {};
      if (Array.isArray(access.tags)) {
        if (access.tags.includes('stairs')) risk.push('Stairs reported by the customer');
        if (access.tags.includes('elevator')) risk.push('Elevator booking may be required by the building');
        if (access.tags.includes('heavy')) risk.push('Heavy items reported');
      }
      brief.known_risks = risk;
      const allBriefs = { ...(project.contractor_brief || {}), [stage.id]: brief };
      await base44.asServiceRole.entities.MoveAssistProject.update(project.id, {
        contractor_brief: allBriefs,
        status_history: logEvent(project, 'brief_prepared', stage.label),
      });
      return Response.json({ ok: true, brief });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}