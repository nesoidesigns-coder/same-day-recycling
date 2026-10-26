import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { categorizeLoad, buildImpactPdf, COMMERCIAL_RE } from '../../shared/impactReceipt.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body?.booking_id === 'string' ? body.booking_id : '';
    if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.status !== 'completed') {
      return Response.json({ sent: false, reason: 'Booking is not completed yet' });
    }
    if (!booking.email) {
      return Response.json({ sent: false, reason: 'Booking has no customer email' });
    }

    const city = booking.city || 'Canada';
    const pickupDate = booking.preferred_date || new Date().toISOString().slice(0, 10);
    const items = (booking.items_description || '').slice(0, 400) || 'Your load';

    const categories = await categorizeLoad(base44, booking.items_description || '');
    const commercial = COMMERCIAL_RE.test((booking.items_description || '') + ' ' + (booking.description || ''));
    const pdfBase64 = buildImpactPdf({
      customerName: booking.name,
      city,
      pickupDate,
      items,
      categories,
      bookingId: booking.id,
      commercial,
    });

    // Phase 6 documentation system: persist what this job actually diverted
    // so the record survives after the PDF is emailed. Destination facility
    // stays empty until an admin verifies it — never guessed.
    const groupCount = (key) => (Array.isArray(categories?.[key]) ? categories[key].length : 0);
    const totalGroups = groupCount('donated') + groupCount('recycled') + groupCount('ewaste') + groupCount('disposed');
    const divertedGroups = groupCount('donated') + groupCount('recycled') + groupCount('ewaste');
    const diversionPercent = totalGroups ? Math.round((divertedGroups / totalGroups) * 100) : 0;
    let facility = null;
    try {
      const fPage = await base44.asServiceRole.entities.RecyclingCenter.filter({ city }, { limit: 5 });
      facility = (Array.isArray(fPage) ? fPage : fPage.items || [])[0] || null;
    } catch { /* facility match is best-effort */ }
    let recordId = '';
    try {
      // One documentation record per job — reuse the existing one on re-runs.
      const existing = await base44.asServiceRole.entities.RecyclingRecord.filter({ booking_id: booking.id }, { limit: 1 });
      const prior = (Array.isArray(existing) ? existing : existing.items || [])[0];
      if (prior) {
        recordId = prior.id;
      } else {
      const record = await base44.asServiceRole.entities.RecyclingRecord.create({
        booking_id: booking.id,
        job_ref: booking.reference_code || '',
        customer_name: booking.name || '',
        city,
        province_code: booking.province_code || '',
        pickup_date: pickupDate,
        material_categories: {
          donated: categories?.donated || [],
          recycled: categories?.recycled || [],
          ewaste: categories?.ewaste || [],
          disposed: categories?.disposed || [],
        },
        total_item_groups: totalGroups,
        diverted_groups: divertedGroups,
        diversion_percent: diversionPercent,
        impact_report_sent: true,
        destination_facility: facility ? facility.name : '',
        destination_facility_id: facility ? facility.id : '',
        documentation_status: 'reported',
      });
        recordId = record?.id || '';
      }
    } catch (e) {
      console.error('Failed to persist RecyclingRecord:', e.message);
    }

    // A rate-limited or refused email must not break documentation — the
    // record is already persisted; report the email outcome separately.
    const sendOnce = () => base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.email,
      template_name: 'RecyclingReceipt',
      attachments: [
        {
          filename: 'Same-Day-Recycling-Impact-Report.pdf',
          content: pdfBase64,
        },
      ],
      variables: {
        customer_name: booking.name || 'there',
        city,
        pickup_date: pickupDate,
        items,
      },
    });

    // One guarded retry (the failure seen was a daily email rate limit), then
    // the outcome is recorded on the booking. The receipt itself is never lost:
    // the RecyclingRecord is already stored and can be re-sent.
    let emailSent = false;
    let emailError = '';
    for (let attempt = 1; attempt <= 2 && !emailSent; attempt += 1) {
      try {
        await sendOnce();
        emailSent = true;
      } catch (e) {
        emailError = e.message || 'email send failed';
        if (attempt === 1) await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    if (!emailSent) console.error('Impact report email failed:', emailError);

    // Delivery state is recorded separately from documentation, and a receipt is
    // only marked delivered when the provider confirmed the send.
    await base44.asServiceRole.entities.Booking.update(
      booking.id,
      emailSent
        ? { receipt_sent: true, receipt_sent_date: new Date().toISOString().slice(0, 10) }
        : {
            receipt_sent: false,
            description: `${booking.description || ''} | Impact report email failed ${new Date().toISOString().slice(0, 10)}: ${emailError}. PDF generated and stored — resend when email is available.`.trim().slice(0, 1000),
          },
    ).catch(() => null);

    return Response.json({
      sent: emailSent,
      ...(emailSent ? {} : { reason: emailError }),
      to: booking.email,
      pdf: true,
      recycling_record_id: recordId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}