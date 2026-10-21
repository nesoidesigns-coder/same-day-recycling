// Solid waste diversion and disposal by jurisdiction, 2022
// Source: Environment and Climate Change Canada — Solid waste diversion and disposal indicator
// https://www.canada.ca/en/environment-climate-change/services/environmental-indicators/solid-waste-diversion-disposal.html
// rate = % of waste diverted (2022) · diverted/disposed = kilograms per person (2022)

export const IMPACT_SOURCE = {
  name: "Environment and Climate Change Canada — Solid Waste Diversion and Disposal, 2022",
  url: "https://www.canada.ca/en/environment-climate-change/services/environmental-indicators/solid-waste-diversion-disposal.html",
};

export const CANADA_AVERAGE = { rate: 27.1, rate2002: 21.6, diverted: 254, disposed: 684 };

export const PROVINCE_IMPACT = [
  { code: "BC", name: "British Columbia", rate: 38.4, rate2002: 31.2, diverted: 331, disposed: 531 },
  { code: "AB", name: "Alberta", rate: 19.6, rate2002: 19.3, diverted: 215, disposed: 880 },
  { code: "SK", name: "Saskatchewan", rate: 17.9, rate2002: 12.8, diverted: 159, disposed: 729 },
  { code: "MB", name: "Manitoba", rate: 19.7, rate2002: 19.4, diverted: 156, disposed: 636 },
  { code: "ON", name: "Ontario", rate: 24.2, rate2002: 19.0, diverted: 226, disposed: 709 },
  { code: "QC", name: "Quebec", rate: 31.5, rate2002: 23.0, diverted: 311, disposed: 678 },
  { code: "NB", name: "New Brunswick", rate: 25.7, rate2002: 24.0, diverted: 215, disposed: 623 },
  { code: "NS", name: "Nova Scotia", rate: 42.9, rate2002: 33.0, diverted: 303, disposed: 403 },
  { code: "PE", name: "Prince Edward Island", rate: null, rate2002: null, diverted: null, disposed: null, notTracked: true },
  { code: "NL", name: "Newfoundland and Labrador", rate: 11.4, rate2002: 7.5, diverted: 88, disposed: 685 },
  { code: "YT", name: "Yukon", rate: null, rate2002: null, diverted: null, disposed: null, notTracked: true },
  { code: "NT", name: "Northwest Territories", rate: null, rate2002: null, diverted: null, disposed: null, notTracked: true },
  { code: "NU", name: "Nunavut", rate: null, rate2002: null, diverted: null, disposed: null, notTracked: true },
];