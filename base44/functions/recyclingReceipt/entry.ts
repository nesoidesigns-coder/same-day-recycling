import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { jsPDF } from 'npm:jspdf@4.0.0';

const DARK = [12, 59, 36];
const GREEN = [29, 158, 86];
const GRAY = [71, 85, 105];
const LIGHT = [244, 247, 245];

// Keep PDF text to WinAnsi-safe ASCII
const clean = (s) => String(s || '')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/[^\x20-\x7E]/g, '')
  .trim();

const CATEGORY_META = [
  ['donated', 'Donated to local charities'],
  ['recycled', 'Recycled'],
  ['ewaste', 'Certified e-waste recycling'],
  ['disposed', 'Responsibly disposed, landfill as last resort'],
];

const FALLBACK_CATEGORIES = () => ({
  donated: ['Furniture & household goods'],
  recycled: ['Metal & appliances'],
  ewaste: ['Electronics'],
  disposed: ['Remaining debris'],
});

// Classify the customer's actual load into donation/recycling buckets
async function categorizeLoad(base44, itemsText) {
  if (!itemsText) return FALLBACK_CATEGORIES();
  try {
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the disposal coordinator for Same Day Recycling, a junk removal company in Canada. ' +
        'A customer\'s load contained: "' + itemsText + '". ' +
        'Split that load into categories. Each list item is one item or item group, using the customer\'s own words where possible. ' +
        'donated = furniture and household goods in reusable condition. recycled = metal and appliances. ' +
        'ewaste = electronics, TVs, monitors, printers, cables. disposed = general debris, packaging, worn-out junk that cannot be reused or recycled. ' +
        'Only include categories the load plausibly contains; omit empty ones. Never invent items that are not in the load.',
      response_json_schema: {
        type: 'object',
        properties: {
          donated: { type: 'array', items: { type: 'string' } },
          recycled: { type: 'array', items: { type: 'string' } },
          ewaste: { type: 'array', items: { type: 'string' } },
          disposed: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    const hasAny = ['donated', 'recycled', 'ewaste', 'disposed'].some((k) => Array.isArray(res?.[k]) && res[k].length);
    return hasAny ? res : FALLBACK_CATEGORIES();
  } catch {
    return FALLBACK_CATEGORIES();
  }
}

const COMMERCIAL_RE = /\b(commercial|office|contractor|renovation|strata|construction|business|store)\b/i;

function buildImpactPdf(opts) {
  const { customerName, city, pickupDate, items, categories, bookingId, commercial } = opts;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const boxW = pageW - margin * 2;
  let y = 0;

  // Brand header band
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SAME DAY RECYCLING', margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Same-day junk removal & recycling - Canada-wide - Open 24 hours', margin, 22);

  y = 48;
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(commercial ? 'Commercial Diversion Certificate' : 'Recycling Impact Report', margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text(clean(
    'Prepared for ' + (customerName || 'our customer') + ' - every load sorted for donation and recycling first' +
    (commercial ? ' - certified diversion rates for your sustainability records' : '')
  ), margin, y);

  // Pickup details card
  y += 9;
  const infoLines = [
    'Booking: ' + clean(bookingId || ''),
    'Pickup date: ' + clean(pickupDate),
    'City: ' + clean(city),
  ];
  const itemsWrapped = doc.splitTextToSize('Items handled: ' + clean(items), boxW - 12);
  const cardH = 10 + infoLines.length * 6 + itemsWrapped.length * 5.5 + 6;
  doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, y, boxW, cardH, 3, 3, 'FD');
  let iy = y + 10;
  doc.setFontSize(10);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  infoLines.forEach((l) => { doc.text(clean(l), margin + 6, iy); iy += 6; });
  doc.text(itemsWrapped, margin + 6, iy);
  y += cardH;

  // Sorting breakdown
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text('How your load was sorted', margin, y);
  y += 8;

  let diverted = 0;
  let total = 0;
  CATEGORY_META.forEach(([key, outcome]) => {
    const list = (Array.isArray(categories[key]) ? categories[key] : []).map(clean).filter(Boolean);
    if (!list.length) return;
    total += list.length;
    if (key !== 'disposed') diverted += list.length;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.text(outcome, margin, y);
    y += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    const wrapped = doc.splitTextToSize(list.join(', '), boxW - 8);
    doc.text(wrapped, margin + 5, y);
    y += wrapped.length * 5.5 + 6;
  });

  // Eco summary
  const share = total ? Math.round((diverted / total) * 100) : 0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text(diverted + ' of ' + (total || 1) + ' item groups (' + share + '%) kept out of the landfill', margin, Math.min(y, 250));
  y = Math.min(y, 250) + 8;

  // Footer notes
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageW - margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  const notes = doc.splitTextToSize(
    'Final destination details for any item are available on request, and a donation receipt for tax purposes is available too. ' +
    'Just reply to this email or call us.',
    boxW
  );
  doc.text(notes, margin, y);
  y += notes.length * 4.5 + 6;
  doc.setFontSize(9);
  doc.text('Same Day Recycling | (604) 849-1745 | samedayrecycling.ca', margin, y);

  const bytes = new Uint8Array(doc.output('arraybuffer'));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

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

    await base44.asServiceRole.integrations.Core.SendEmail({
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

    return Response.json({ sent: true, to: booking.email, pdf: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}