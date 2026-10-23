// Shared constants for the Demand Intelligence admin pages — mirrors
// base44/shared/demand.ts on the server so frontend labels always match.
export const SERVICE_CATEGORIES = [
  "junk_removal", "furniture_removal", "mattress_disposal", "appliance_removal", "electronics",
  "recycling", "waste_disposal", "estate_cleanout", "construction_debris",
  "yard_waste_removal", "commercial_waste", "hot_tub_removal", "scrap_metal",
  "bin_rentals", "same_day_pickup", "other",
];

export const CATEGORY_LABELS = {
  junk_removal: "Junk Removal",
  furniture_removal: "Furniture Removal",
  appliance_removal: "Appliance Removal",
  mattress_disposal: "Mattress Disposal",
  electronics: "Electronics Recycling",
  recycling: "Recycling",
  waste_disposal: "Waste Disposal",
  estate_cleanout: "Estate Cleanouts",
  construction_debris: "Construction Debris",
  yard_waste_removal: "Yard Waste Removal",
  commercial_waste: "Commercial Waste Removal",
  hot_tub_removal: "Hot Tub Removal",
  scrap_metal: "Scrap Metal Recycling",
  bin_rentals: "Bin Rentals",
  same_day_pickup: "Same-Day Junk Pickup",
  other: "Other Services",
};

export const PROVINCES = [
  ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"],
  ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"],
  ["NS", "Nova Scotia"], ["NT", "Northwest Territories"], ["NU", "Nunavut"],
  ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"],
  ["SK", "Saskatchewan"], ["YT", "Yukon"],
];