export const CITIES = [
  { name: "Vancouver", slug: "vancouver", blurb: "Our home base — fastest dispatch across the city, Kitsilano to East Van." },
  { name: "Burnaby", slug: "burnaby", blurb: "Serving all of Burnaby, from Metrotown to Brentwood and the Heights." },
  { name: "Richmond", slug: "richmond", blurb: "Covering Richmond, Steveston and Sea Island with same-day pickups." },
  { name: "Surrey", slug: "surrey", blurb: "Surrey, White Rock and Cloverdale — big loads welcome." },
  { name: "Coquitlam", slug: "coquitlam", blurb: "Coquitlam, Port Coquitlam and Port Moody, all Tri-Cities covered." },
  { name: "Kamloops", slug: "kamloops", blurb: "Kamloops and area — book before noon for same-day service." },
  { name: "Kelowna", slug: "kelowna", blurb: "Kelowna, West Kelowna and the Central Okanagan." },
];

export const cityFromSlug = (slug) => CITIES.find((c) => c.slug === slug) || null;