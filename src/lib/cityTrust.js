// Per-city trust credentials for the local landing pages.
// Local facilities, partners and track record — the stuff Google and
// neighbours both look for.
export const CITY_CREDENTIALS = {
  vancouver: [
    "1,000+ pickups completed in Vancouver",
    "Hauls through Metro Vancouver transfer stations",
    "Donation partners across East Van and Downtown",
    "Condo & strata move-out experience in Yaletown and Downtown",
  ],
  burnaby: [
    "Regular hauls to the Burnaby Eco Centre",
    "Strata & condo move-out specialists",
    "Trusted by Burnaby property managers",
    "Tri-Cities donation partners",
  ],
  richmond: [
    "Hauls to the Richmond Recycling Depot",
    "Eco-disposal receipts for strata managers",
    "Townhouse turnover specialists",
    "Serving Steveston to Bridgeport daily",
  ],
  surrey: [
    "Dedicated north & south Surrey crews",
    "Estate cleanout specialists",
    "Scrap metal recycled on every load",
    "Serving White Rock, Cloverdale and Guildford",
  ],
  coquitlam: [
    "One Tri-Cities route: Coquitlam, PoCo, Port Moody",
    "Hauls to the Coquitlam transfer station on United Blvd",
    "Renovation debris hauling specialists",
    "Burke Mountain to Ranch Park, covered daily",
  ],
  kamloops: [
    "True same-day service across the whole city",
    "Hot tub and large-item removal specialists",
    "Hauls through Kamloops-area facilities",
    "Serving Sahali, Valleyview, Dallas and Aberdeen",
  ],
  kelowna: [
    "Okanagan donation partners first, landfill last",
    "Hot tub and above-ground pool removal",
    "Hauls through Central Okanagan facilities",
    "Serving West Kelowna, Rutland and Mission",
  ],
  "maple-ridge": [
    "Dedicated same-day route for Maple Ridge",
    "Acreage and hot tub removal specialists",
    "Hauls through Metro Vancouver facilities",
    "Serving Haney, Albion, Silver Valley and Thornhill",
  ],
  "pitt-meadows": [
    "Same-day service, not next-day, in Pitt Meadows",
    "On the daily Maple Ridge route",
    "Farm and rural property cleanouts",
    "Serving Osprey Village, South Bonson and the town core",
  ],
};

export const cityCredentialsFor = (slug) => CITY_CREDENTIALS[slug] || null;