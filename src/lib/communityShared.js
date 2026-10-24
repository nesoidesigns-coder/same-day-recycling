// Shared community vocabulary used by the community page, the owner command
// center and the backend functions. Single source of truth for channel,
// province, member-type, opportunity and library labels.
export const CHANNELS = [
  { id: 'general', label: 'General Discussion', desc: 'Industry news, questions, advice and professional conversations.' },
  { id: 'contractor_exchange', label: 'Contractor Exchange', desc: 'Networking, overflow work, partnerships and subcontracting.' },
  { id: 'ai_academy', label: 'AI Business Master Academy', desc: 'Business management, financial education, pricing and operations.' },
  { id: 'recycling_exchange', label: 'Recycling & Reuse Exchange', desc: 'Donations, reusable materials, recycling resources and waste reduction.' },
  { id: 'equipment_ops', label: 'Equipment & Operations', desc: 'Vehicles, equipment, scheduling, logistics and operating practices.' },
  { id: 'provincial', label: 'Provincial Networks', desc: 'Regional business communities across Canada.' },
  { id: 'ideas_feedback', label: 'Ideas & Feedback', desc: 'Recommend Recycling OS improvements and vote on proposed features.' },
  { id: 'announcements', label: 'Announcements', desc: 'Official community news from the Same Day Recycling team.' },
];

export const PROVINCES = [
  { id: 'national', label: 'National' },
  { id: 'BC', label: 'British Columbia' },
  { id: 'AB', label: 'Alberta' },
  { id: 'SK', label: 'Saskatchewan' },
  { id: 'MB', label: 'Manitoba' },
  { id: 'ON', label: 'Ontario' },
  { id: 'QC', label: 'Quebec' },
  { id: 'atlantic', label: 'Atlantic Canada' },
  { id: 'northern', label: 'Northern Canada' },
];

export const MEMBER_TYPES = [
  { id: 'independent_contractor', label: 'Independent contractor' },
  { id: 'recycling_business_owner', label: 'Recycling business owner' },
  { id: 'junk_removal_operator', label: 'Junk removal operator' },
  { id: 'property_management_professional', label: 'Property management professional' },
  { id: 'recycling_industry_professional', label: 'Recycling industry professional' },
  { id: 'general_member', label: 'General community member' },
];

export const OPPORTUNITY_TYPES = [
  { id: 'overflow_job', label: 'Overflow job' },
  { id: 'subcontracting', label: 'Subcontracting request' },
  { id: 'partnership', label: 'Regional partnership' },
  { id: 'equipment_available', label: 'Equipment available' },
  { id: 'crew_available', label: 'Crew available' },
  { id: 'collaboration', label: 'Business collaboration' },
];

export const RESOURCE_CATEGORIES = [
  { id: 'starting_out', label: 'Starting a junk removal business' },
  { id: 'pricing', label: 'Pricing and estimating' },
  { id: 'customer_service', label: 'Customer service' },
  { id: 'recycling_practices', label: 'Canadian recycling practices' },
  { id: 'equipment_fleet', label: 'Equipment and fleet management' },
  { id: 'financial_management', label: 'Financial management' },
  { id: 'administration', label: 'Business administration' },
  { id: 'partnerships', label: 'Contractor partnerships' },
];

export const channelLabel = (id) => (CHANNELS.find((c) => c.id === id) || {}).label || id;
export const provinceLabel = (id) => (PROVINCES.find((p) => p.id === id) || {}).label || id;
export const memberTypeLabel = (id) => (MEMBER_TYPES.find((m) => m.id === id) || {}).label || id;
export const opportunityTypeLabel = (id) => (OPPORTUNITY_TYPES.find((t) => t.id === id) || {}).label || id;
export const resourceCategoryLabel = (id) => (RESOURCE_CATEGORIES.find((c) => c.id === id) || {}).label || id;