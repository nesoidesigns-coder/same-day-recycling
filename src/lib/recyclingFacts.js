// Curated, scientifically-verified recycling statistics with published sources.
// These are the defaults the site shows; the auto-sync refreshes the RecyclingFact
// entity monthly and overrides these when fresher verified figures are found.
export const RECYCLING_FACTS = [
  {
    key: "canada_diversion_rate",
    stat: "27.1%",
    label: "of Canada's solid waste was diverted in 2022",
    detail: "9.9 million tonnes were recycled or composted, but 26.6 million tonnes still went to landfill or incineration.",
    source_name: "Environment and Climate Change Canada",
    source_url: "https://www.canada.ca/en/environment-climate-change/services/environmental-indicators/solid-waste-diversion-disposal.html",
    verified_date: "2026-10-21",
  },
  {
    key: "landfill_methane",
    stat: "17%",
    label: "of Canada's methane emissions come from landfills",
    detail: "Biodegradable waste in landfills releases methane, a greenhouse gas far more potent than CO2. Diverting recyclables and organics cuts it at the source.",
    source_name: "ECCC Greenhouse Gas Inventory (2023 data)",
    source_url: "https://www.canada.ca/en/environment-climate-change/services/managing-reducing-waste/municipal-solid/waste-greenhouse-gases-canada-actions.html",
    verified_date: "2026-10-21",
  },
  {
    key: "aluminum_energy",
    stat: "95%",
    label: "less energy to recycle aluminum than to make it new",
    detail: "Recycled aluminum needs about 8.3 GJ per tonne versus primary production, a 95.5% energy saving with a similar cut in greenhouse gas emissions.",
    source_name: "International Aluminium Institute",
    source_url: "https://international-aluminium.org/landing/aluminium-recycling-saves-95-of-the-energy-needed-for-primary-aluminium-production/",
    verified_date: "2026-10-21",
  },
  {
    key: "plastics_canada",
    stat: "9%",
    label: "of plastic thrown away in Canada actually gets diverted",
    detail: "Canadians throw away more than 3 million tonnes of plastic every year, and almost all of it still ends up in the landfill.",
    source_name: "Environment and Climate Change Canada",
    source_url: "https://www.canada.ca/en/environment-climate-change/services/environmental-indicators/solid-waste-diversion-disposal.html",
    verified_date: "2026-10-21",
  },
  {
    key: "ewaste_global",
    stat: "22.3%",
    label: "of the world's e-waste is formally collected and recycled",
    detail: "A record 62 million tonnes of e-waste was generated in 2022, up 82% since 2010, leaving recoverable metals and pollution risks unmanaged.",
    source_name: "UN Global E-waste Monitor 2024",
    source_url: "https://ewastemonitor.info/the-global-e-waste-monitor-2024/",
    verified_date: "2026-10-21",
  },
  {
    key: "ns_leadership",
    stat: "43%",
    label: "Nova Scotia's diversion rate, the best in Canada",
    detail: "Proof the 27% national average is not a ceiling: with the right systems, nearly half of all waste can be kept out of the landfill.",
    source_name: "Environment and Climate Change Canada",
    source_url: "https://www.canada.ca/en/environment-climate-change/services/environmental-indicators/solid-waste-diversion-disposal.html",
    verified_date: "2026-10-21",
  },
];