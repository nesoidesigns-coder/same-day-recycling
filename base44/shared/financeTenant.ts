// Resolve which business (tenant) a logged-in user represents for Recycling OS finance.
// Contractors match a Partner by email; white-label owners match a WhiteLabelClient;
// admins manage Same Day Recycling's own books.
export async function resolveTenant(srole, user) {
  const email = String(user.email || '').toLowerCase().trim();
  if (user.role === 'admin') {
    return {
      owner_type: 'sdr_admin',
      owner_email: email,
      business_name: 'Same Day Recycling',
      partner_id: '',
      white_label_id: '',
    };
  }
  const { items: partners } = await srole.entities.Partner.filter({ email }, { limit: 1 });
  if (partners && partners.length) {
    return {
      owner_type: 'contractor',
      owner_email: email,
      business_name: partners[0].name || 'My contracting business',
      partner_id: partners[0].id,
      white_label_id: '',
    };
  }
  const { items: wl } = await srole.entities.WhiteLabelClient.filter({ email }, { limit: 1 });
  if (wl && wl.length) {
    return {
      owner_type: 'white_label',
      owner_email: email,
      business_name: wl[0].company || 'My business',
      partner_id: '',
      white_label_id: wl[0].id,
    };
  }
  return {
    owner_type: 'personal',
    owner_email: email,
    business_name: user.full_name || 'My business',
    partner_id: '',
    white_label_id: '',
  };
}