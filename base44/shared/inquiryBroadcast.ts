// Broadcasts a captured web service inquiry to two destinations:
// 1. The community Opportunity Board as an open job listing (privacy-safe:
//    customer contact details are stripped; members respond via dispatch).
// 2. An email alert to the owner.
// Never throws — a broadcast failure must not block the primary inquiry save.
const OWNER_EMAIL = 'nesoidesigns@gmail.com';

const sanitize = (text) => String(text || '')
  .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[contact shared via dispatch]')
  .replace(/(\+?\d[\d\s().-]{8,}\d)/g, '[phone shared via dispatch]')
  .trim();

export async function broadcastInquiry(base44, { source, title, description, city }) {
  try {
    const sr = base44.asServiceRole;
    const clean = sanitize(description).slice(0, 2500) || 'Service request details provided by the customer.';
    await sr.entities.CommunityOpportunity.create({
      type: 'overflow_job',
      title: String(title || 'Customer service request').slice(0, 200),
      description: `Customer inquiry captured from the website (${source}):\n\n${clean}`,
      city: String(city || '').slice(0, 80),
      service_category: '',
      poster_name: 'Same Day Recycling (web inquiry)',
      poster_verified: true,
      contact_method: 'Respond through Same Day Recycling dispatch: (604) 849-1745 or samedayrecycling@gmail.com.',
      status: 'open',
    });
    await sr.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      from_name: 'Same Day Recycling Website',
      subject: `New web service inquiry posted${city ? ' - ' + city : ''}`,
      text: `Source: ${source}\nTitle: ${title}\nCity: ${city || 'n/a'}\n\n${clean}\n\nPosted to the community Opportunity Board.`,
    });
    return true;
  } catch (error) {
    console.log('inquiryBroadcast failed:', error?.message);
    return false;
  }
}