import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolveTenant } from '../../shared/financeTenant.ts';

const CATEGORIES = ['job_income', 'other_income', 'fuel', 'vehicle', 'equipment', 'disposal_fees', 'contractor_payment', 'insurance', 'office', 'marketing', 'professional_fees', 'other'];
const STATUSES = ['paid', 'outstanding', 'refunded', 'disputed'];

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to use the finance tools.' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'tenant');
    const tenant = await resolveTenant(base44.asServiceRole, user);

    if (action === 'tenant') {
      return Response.json({ tenant });
    }

    if (action === 'extract') {
      const fileUri = String(body.file_uri || '').trim();
      if (!fileUri) return Response.json({ error: 'No receipt file provided.' }, { status: 400 });
      let signedUrl = fileUri;
      try {
        const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 3600 });
        signedUrl = signed.signed_url || fileUri;
      } catch (e) { /* fall back to the raw URI */ }
      const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'You are the receipt extraction engine for Recycling OS, a Canadian junk removal and recycling platform. Extract the following from this receipt, invoice or payment document image/PDF. Read carefully: merchant or payer name; transaction date as YYYY-MM-DD; total (amount paid, including tax); subtotal before tax; every sales tax line you can identify, separated as GST, HST, PST or QST amounts (0 when absent); the province or context that suggests the tax jurisdiction (a Canadian province code like BC, AB, ON, QC, or blank); an expense or income category from this exact list: job_income, other_income, fuel, vehicle, equipment, disposal_fees, contractor_payment, insurance, office, marketing, professional_fees, other (fuel, disposal_fees and vehicle are the most common for this business); the payment method if visible; and a one-line description of what was bought or earned. Also give a confidence score from 0 to 1 for how sure you are of the whole extraction. If a value is not visible, return an empty string or 0 rather than guessing.',
        file_urls: [signedUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            merchant: { type: 'string' },
            tx_date: { type: 'string', description: 'YYYY-MM-DD' },
            total: { type: 'number' },
            subtotal: { type: 'number' },
            gst: { type: 'number' },
            hst: { type: 'number' },
            pst: { type: 'number' },
            qst: { type: 'number' },
            tax_jurisdiction: { type: 'string' },
            category: { type: 'string', enum: CATEGORIES },
            payment_method: { type: 'string' },
            description: { type: 'string' },
            confidence: { type: 'number' },
          },
          required: ['total'],
        },
      });
      const p = extracted || {};
      const { items: mine } = await base44.entities.FinancialTx.filter({ owner_email: tenant.owner_email }, { limit: 200 });
      let duplicateOf = '';
      const total = round2(p.total);
      if (total) {
        const d = String(p.tx_date || '');
        const merch = String(p.merchant || '').toLowerCase().trim();
        for (const t of mine) {
          const sameAmt = Math.abs((Number(t.amount) || 0) - total) < 0.01;
          const sameDate = d ? t.tx_date === d : true;
          const sameMerch = merch ? String(t.merchant || '').toLowerCase().trim() === merch : false;
          if (sameAmt && sameMerch && sameDate) { duplicateOf = t.id; break; }
        }
      }
      const issues = [];
      if (!p.merchant) issues.push('Merchant or payer missing');
      if (!p.tx_date) issues.push('Transaction date missing');
      if (!total) issues.push('Total amount missing');
      const taxSum = round2((Number(p.gst) || 0) + (Number(p.hst) || 0) + (Number(p.pst) || 0) + (Number(p.qst) || 0));
      if (total && p.subtotal && Math.abs(round2(round2(p.subtotal) + taxSum) - total) > 0.02) {
        issues.push('Subtotal plus taxes does not match the total - check the numbers');
      }
      if (duplicateOf) issues.push('This looks like a duplicate of an existing transaction');
      return Response.json({
        tenant,
        proposal: {
          merchant: p.merchant || '',
          tx_date: p.tx_date || '',
          total,
          subtotal_amount: round2(p.subtotal),
          tax_detail: { gst: round2(p.gst), hst: round2(p.hst), pst: round2(p.pst), qst: round2(p.qst) },
          tax_jurisdiction: p.tax_jurisdiction || '',
          category: CATEGORIES.includes(p.category) ? p.category : 'other',
          payment_method: p.payment_method || '',
          description: p.description || '',
        },
        confidence: Number(p.confidence) || 0,
        issues,
        duplicate_of: duplicateOf,
      });
    }

    if (action === 'save') {
      const d = body.data || {};
      const amount = round2(Number(d.amount));
      if (!amount) return Response.json({ error: 'A total amount is required.' }, { status: 400 });
      const rec = {
        owner_type: tenant.owner_type,
        owner_email: tenant.owner_email,
        business_name: tenant.business_name,
        partner_id: tenant.partner_id,
        white_label_id: tenant.white_label_id,
        kind: d.kind === 'income' ? 'income' : 'expense',
        source: d.source === 'platform_job' ? 'platform_job' : 'independent',
        booking_id: String(d.booking_id || ''),
        job_label: String(d.job_label || ''),
        merchant: String(d.merchant || ''),
        description: String(d.description || '').slice(0, 1000),
        tx_date: String(d.tx_date || new Date().toISOString().slice(0, 10)),
        amount,
        subtotal_amount: round2(Number(d.subtotal_amount) || 0),
        tax_detail: d.tax_detail && typeof d.tax_detail === 'object' ? d.tax_detail : {},
        tax_jurisdiction: String(d.tax_jurisdiction || ''),
        category: String(d.category || 'other'),
        payment_method: String(d.payment_method || ''),
        status: STATUSES.includes(d.status) ? d.status : 'paid',
        receipt_uri: String(d.receipt_uri || ''),
        receipt_name: String(d.receipt_name || ''),
        extracted_json: d.extracted_json && typeof d.extracted_json === 'object' ? d.extracted_json : {},
        classification_confidence: round2(Number(d.classification_confidence) || 0),
        needs_review: !!d.needs_review,
        duplicate_of: String(d.duplicate_of || ''),
        notes: String(d.notes || '').slice(0, 1000),
      };
      const created = await base44.entities.FinancialTx.create(rec);
      await base44.entities.FinancialAuditLog.create({
        owner_email: tenant.owner_email,
        action: rec.extracted_json && Object.keys(rec.extracted_json).length ? 'ai_import' : 'create',
        tx_id: created.id,
        actor_email: user.email,
        actor_role: user.role || 'user',
        summary: 'Recorded ' + rec.kind + ' of $' + amount.toFixed(2) + (rec.merchant ? ' (' + rec.merchant + ')' : '') + ' in category ' + rec.category + '.',
        detail: { proposal: rec.extracted_json, issues: body.issues || [] },
      });
      return Response.json({ tx: created });
    }

    if (action === 'update') {
      const id = String(body.id || '');
      const changes = body.changes || {};
      const allowed = ['kind', 'category', 'status', 'merchant', 'description', 'tx_date', 'amount', 'subtotal_amount', 'tax_detail', 'tax_jurisdiction', 'payment_method', 'needs_review', 'notes', 'source', 'booking_id', 'job_label'];
      const patch = {};
      for (const k of allowed) if (k in changes) patch[k] = changes[k];
      if (!id || !Object.keys(patch).length) return Response.json({ error: 'Nothing to update.' }, { status: 400 });
      const before = await base44.entities.FinancialTx.get(id).catch(() => null);
      if (!before || !before.id) return Response.json({ error: 'Transaction not found.' }, { status: 404 });
      if ('amount' in patch) patch.amount = round2(Number(patch.amount)) || before.amount;
      if ('needs_review' in patch && patch.needs_review === false) patch.classification_confidence = 1;
      const after = await base44.entities.FinancialTx.update(id, patch);
      await base44.entities.FinancialAuditLog.create({
        owner_email: tenant.owner_email,
        action: 'correction',
        tx_id: id,
        actor_email: user.email,
        actor_role: user.role || 'user',
        summary: 'Corrected transaction: ' + Object.keys(patch).join(', ') + '.',
        detail: { before: { category: before.category, status: before.status, amount: before.amount, needs_review: before.needs_review }, patch },
      });
      return Response.json({ tx: after });
    }

    if (action === 'log_export') {
      await base44.entities.FinancialAuditLog.create({
        owner_email: tenant.owner_email,
        action: 'export',
        actor_email: user.email,
        actor_role: user.role || 'user',
        summary: 'Exported ' + String(body.row_count || 0) + ' transactions.',
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}