export const CITIES = [
  { name: "Vancouver", slug: "vancouver", lat: 49.2827, lng: -123.1207, radius: 12000, blurb: "Our home base — fastest dispatch across the city, Kitsilano to East Van." },
  { name: "Burnaby", slug: "burnaby", lat: 49.2488, lng: -122.9805, radius: 9000, blurb: "Serving all of Burnaby, from Metrotown to Brentwood and the Heights." },
  { name: "Richmond", slug: "richmond", lat: 49.1669, lng: -123.1336, radius: 9000, blurb: "Covering Richmond, Steveston and Sea Island with same-day pickups." },
  { name: "Surrey", slug: "surrey", lat: 49.1913, lng: -122.849, radius: 12000, blurb: "Surrey, White Rock and Cloverdale — big loads welcome." },
  { name: "Coquitlam", slug: "coquitlam", lat: 49.2838, lng: -122.7932, radius: 9000, blurb: "Coquitlam, Port Coquitlam and Port Moody, all Tri-Cities covered." },
  { name: "Kamloops", slug: "kamloops", lat: 50.674, lng: -120.3273, radius: 12000, blurb: "Kamloops and area — book before noon for same-day service." },
  { name: "Kelowna", slug: "kelowna", lat: 49.8801, lng: -119.4432, radius: 12000, blurb: "Kelowna, West Kelowna and the Central Okanagan." },
];

export const cityFromSlug = (slug) => CITIES.find((c) => c.slug === slug) || null;