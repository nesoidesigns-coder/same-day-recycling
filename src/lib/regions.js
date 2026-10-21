// Canada's provinces and territories — national coverage architecture.
// status is derived at render time from verified provider counts, never hardcoded as "live".
export const REGIONS = [
  { code: "BC", name: "British Columbia", type: "province", capital: "Victoria", lat: 49.2488, lng: -122.9805 },
  { code: "AB", name: "Alberta", type: "province", capital: "Edmonton", lat: 53.5461, lng: -113.4938 },
  { code: "SK", name: "Saskatchewan", type: "province", capital: "Regina", lat: 50.4452, lng: -104.6189 },
  { code: "MB", name: "Manitoba", type: "province", capital: "Winnipeg", lat: 49.8951, lng: -97.1384 },
  { code: "ON", name: "Ontario", type: "province", capital: "Toronto", lat: 43.6532, lng: -79.3832 },
  { code: "QC", name: "Quebec", type: "province", capital: "Québec City", lat: 46.8139, lng: -71.208 },
  { code: "NB", name: "New Brunswick", type: "province", capital: "Fredericton", lat: 45.9636, lng: -66.6431 },
  { code: "NS", name: "Nova Scotia", type: "province", capital: "Halifax", lat: 44.6488, lng: -63.5752 },
  { code: "PE", name: "Prince Edward Island", type: "province", capital: "Charlottetown", lat: 46.2382, lng: -63.1311 },
  { code: "NL", name: "Newfoundland and Labrador", type: "province", capital: "St. John's", lat: 47.5615, lng: -52.7126 },
  { code: "YT", name: "Yukon", type: "territory", capital: "Whitehorse", lat: 60.7212, lng: -135.0549 },
  { code: "NT", name: "Northwest Territories", type: "territory", capital: "Yellowknife", lat: 62.454, lng: -114.3718 },
  { code: "NU", name: "Nunavut", type: "territory", capital: "Iqaluit", lat: 63.7494, lng: -68.5176 },
];

export const regionByCode = (code) => REGIONS.find((r) => r.code === code) || null;