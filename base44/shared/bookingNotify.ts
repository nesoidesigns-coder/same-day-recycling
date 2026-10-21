// Business owner address — the one shown on the live site footer and used
// by sendCustomerEmail. Credentials are the built-in Base44 SendEmail
// integration (server-side only, never exposed to the frontend).
export const OWNER_EMAIL = 'samedayrecycling@gmail.com';
export const BUSINESS_PHONE = '(604) 849-1745';

// Sends the owner alert and the customer confirmation for a new booking.
// Shared by createBooking (manual form) and aiBooking (self-driven AI center).
export async function sendBookingNotifications(srole, b) {
  const preferred = `${b.preferred_date || 'any date'}${b.time_window ? ` · ${b.time_window}` : ''}`;
  const ownerText = `New booking: ${b.name}, ${b.phone}. ${b.address}${b.city ? ', ' + b.city : ''}. ${b.items_description}. Preferred: ${preferred}.${b.quote_estimate ? ` Quote: ${b.quote_estimate}.` : ''}${b.email ? ` Email: ${b.email}.` : ''}`;

  let ownerEmail = 'failed';
  try {
    await srole.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      from_name: 'Same Day Recycling',
      subject: `New booking: ${b.name}${b.city ? ` — ${b.city}` : ''}`,
      text: ownerText,
      html: `<div style="font-family:sans-serif;max-width:560px">
          <h2 style="color:#0c3b24">New booking received</h2>
          <p style="margin:0;font-size:18px;font-weight:bold">${b.name}</p>
          <p style="margin:4px 0"><a href="tel:${b.phone}" style="color:#1d9e56;font-weight:bold">${b.phone}</a>${b.email ? ` · ${b.email}` : ''}</p>
          <p style="margin:4px 0"><strong>Address:</strong> ${b.address}${b.city ? `, ${b.city}` : ''}</p>
          <p style="margin:4px 0"><strong>Items:</strong> ${b.items_description}</p>
          <p style="margin:4px 0"><strong>Preferred:</strong> ${preferred}</p>
          ${b.quote_estimate ? `<p style="margin:4px 0"><strong>Quote:</strong> ${b.quote_estimate}</p>` : ''}
          <p style="margin-top:16px;color:#64748b;font-size:13px">Manage it in the admin dashboard → /admin/jobs</p>
        </div>`,
    });
    ownerEmail = 'sent';
  } catch (e) {
    ownerEmail = 'failed';
    const msg = String((e && e.message) || e);
    console.error('Owner alert email failed:', msg);
    notified.errors.push('owner: ' + msg);
  }

  const notified = { owner_email: ownerEmail, customer_email: 'skipped', errors: [] as string[] };

  const customerHtml = `<div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0c3b24">Your pickup is booked ✅</h2>
      <p style="margin:0 0 12px">Hi ${b.name}, thanks for choosing Same Day Recycling. Here's what we have:</p>
      <p style="margin:4px 0"><strong>Service:</strong> ${b.items_description}${b.quote_estimate ? ` (${b.quote_estimate})` : ''}</p>
      <p style="margin:4px 0"><strong>Date / time:</strong> ${preferred}</p>
      <p style="margin:4px 0"><strong>Address:</strong> ${b.address}${b.city ? `, ${b.city}` : ''}</p>
      <p style="margin-top:12px">We'll confirm your exact time slot shortly.</p>
      <p style="margin-top:12px;font-size:13px;color:#64748b">Your request status: Request received → Confirmed → Scheduled → Completed. We update you at every step.</p>
      <p style="margin-top:12px">Questions? Call us at <a href="tel:+16048491745" style="color:#1d9e56;font-weight:bold">${BUSINESS_PHONE}</a></p>
    </div>`;

  if (b.email) {
    try {
      await srole.integrations.Core.SendEmail({
        to: b.email,
        from_name: 'Same Day Recycling',
        subject: `Booking received — we'll confirm your time slot shortly`,
        text: `Hi ${b.name}, your pickup is booked! Service: ${b.items_description}${b.quote_estimate ? ` (${b.quote_estimate})` : ''}. Date/time: ${preferred}. Address: ${b.address}${b.city ? ', ' + b.city : ''}. We'll confirm your exact time slot shortly. Your request status: Request received, Confirmed, Scheduled, Completed. We update you at every step. Questions? Call ${BUSINESS_PHONE}.`,
        html: customerHtml,
      });
      notified.customer_email = 'sent';
      } catch (e) {
      notified.customer_email = 'failed';
      const msg = String((e && e.message) || e);
      console.error('Customer confirmation email failed:', msg);
      notified.errors.push('customer: ' + msg);
      }
  }

  return notified;
}