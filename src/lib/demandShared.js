// Shared constants for the Demand Intelligence admin pages — mirrors
// base44/shared/demand.ts on the server so frontend labels always match.
export const SERVICE_CATEGORIES = [
  "junk_removal", "furniture_removal", "appliance_removal", "electronics",
  "recycling", "waste_disposal", "estate_cleanout", "construction_debris", "other",
];

export const CATEGORY_LABELS = {
  junk_removal: "Junk Removal",
  furniture_removal: "Furniture Removal",
  appliance_removal: "Appliance Removal",
  electronics: "Electronics Recycling",
  recycling: "Recycling",
  waste_disposal: "Waste Disposal",
  estate_cleanout: "Estate Cleanouts",
  construction_debris: "Construction Debris",
  other: "Other Services",
};

export const PROVINCES = [
  ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"],
  ["NB", "New Brunswick"], ["NL", "Newfoundland and Labrador"],
  ["NS", "Nova Scotia"], ["NT", "Northwest Territories"], ["NU", "Nunavut"],
  ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"],
  ["SK", "Saskatchewan"], ["YT", "Yukon"],
];