// Frontend-facing constants for the hybrid intelligent dispatch system.
// Mirrors base44/shared/dispatchEngine.ts (frontend must not import from base44/).

// Lead-offer statuses shown to contractors and admins.
export const OFFER_STATUS_LABEL = {
  offered: "Offered — awaiting your response",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired — no response in time",
  superseded: "Reassigned by dispatch",
};

// Matches the equipment keywords used by the server-side matcher.
export const EQUIPMENT_OPTIONS = [
  "dump truck",
  "pickup truck",
  "trailer",
  "bin",
  "appliances",
  "electronics",
  "metal",
];

export const SERVICE_LABELS = {
  junk_removal: "Junk removal",
  furniture: "Furniture",
  appliances: "Appliances",
  electronics: "Electronics",
  metal_pickup: "Metal pickup",
  cleanouts: "Cleanout",
  other: "Other",
};