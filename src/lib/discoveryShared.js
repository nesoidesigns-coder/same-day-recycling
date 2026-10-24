// Shared labels for the national public opportunity discovery feed and Live Jobs board.
export const CLASSIFICATIONS = [
  { id: 'active_request', label: 'Active request', tone: 'bg-[#187B65] text-white' },
  { id: 'potential_opportunity', label: 'Potential opportunity', tone: 'bg-amber-100 text-amber-800' },
  { id: 'general_discussion', label: 'General discussion', tone: 'bg-slate-100 text-slate-600' },
  { id: 'unverified', label: 'Unverified', tone: 'bg-slate-100 text-slate-400' },
];

export const SERVICE_CATEGORIES = [
  { id: 'junk_removal', label: 'Junk removal' },
  { id: 'furniture_removal', label: 'Furniture pickup' },
  { id: 'appliance_removal', label: 'Appliance removal' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'recycling', label: 'Recycling' },
  { id: 'waste_disposal', label: 'Waste disposal' },
  { id: 'estate_cleanout', label: 'Estate cleanout' },
  { id: 'construction_debris', label: 'Construction debris' },
  { id: 'demolition_cleanup', label: 'Demolition cleanup' },
  { id: 'mattress_disposal', label: 'Mattress disposal' },
  { id: 'yard_waste_removal', label: 'Yard waste' },
  { id: 'commercial_waste', label: 'Commercial waste' },
  { id: 'hot_tub_removal', label: 'Hot tub removal' },
  { id: 'scrap_metal', label: 'Scrap metal pickup' },
  { id: 'bin_rentals', label: 'Bin rentals' },
  { id: 'same_day_pickup', label: 'Same-day pickup' },
  { id: 'other', label: 'Other services' },
];

// Live Jobs workflow status. Reddit discussions stay potential leads until a
// customer confirms a booking; only the owner advances a job through the pipeline.
export const JOB_STATUSES = [
  { id: 'potential_lead', label: 'Potential lead', tone: 'bg-amber-100 text-amber-800' },
  { id: 'verified_request', label: 'Verified request', tone: 'bg-sky-100 text-sky-800' },
  { id: 'available_job', label: 'Available job', tone: 'bg-[#187B65] text-white' },
  { id: 'assigned', label: 'Assigned', tone: 'bg-indigo-100 text-indigo-800' },
  { id: 'completed', label: 'Completed', tone: 'bg-emerald-100 text-emerald-800' },
];

export const classificationMeta = (id) => CLASSIFICATIONS.find((c) => c.id === id) || CLASSIFICATIONS[3];
export const serviceCategoryLabel = (id) => (SERVICE_CATEGORIES.find((c) => c.id === id) || {}).label || 'Other services';
export const jobStatusMeta = (id) => JOB_STATUSES.find((s) => s.id === id) || JOB_STATUSES[0];