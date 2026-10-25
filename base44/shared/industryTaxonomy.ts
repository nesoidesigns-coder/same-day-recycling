// National industry taxonomy for the Recycling OS demand gauge.
// Sixteen top-level Canadian industries, each with subdivisions and individual
// search topics. Junk removal is one subdivision of home services — not the
// centre. This module is the canonical seed; IndustryNode holds the live copy.

export interface GaugeTopic { slug: string; name: string; keywords: string[] }
export interface GaugeSubdivision { slug: string; name: string; topics: GaugeTopic[] }
export interface GaugeIndustry { slug: string; name: string; blurb: string; subdivisions: GaugeSubdivision[] }

const t = (slug: string, name: string, keywords: string[]): GaugeTopic => ({ slug, name, keywords });

export const INDUSTRY_TAXONOMY: GaugeIndustry[] = [
  {
    slug: "home-property-services", name: "Home & Property Services", blurb: "Everyday services for houses, apartments and condos.",
    subdivisions: [
      { slug: "junk-waste-removal", name: "Junk & Waste Removal", topics: [
        t("junk-removal", "Junk removal", ["junk removal", "junk haul"]),
        t("furniture-removal", "Furniture removal", ["furniture removal", "furniture"]),
        t("appliance-removal", "Appliance removal", ["appliance removal", "appliance"]),
        t("mattress-disposal", "Mattress disposal", ["mattress disposal", "mattress"]),
        t("scrap-metal-pickup", "Scrap metal pickup", ["scrap metal", "metal pickup"]),
        t("hot-tub-removal", "Hot tub removal", ["hot tub"]),
      ]},
      { slug: "waste-recycling", name: "Waste & Recycling", topics: [
        t("waste-disposal", "Waste disposal", ["waste disposal"]),
        t("recycling-drop-off", "Recycling drop-off", ["recycling", "recycle"]),
        t("bin-rentals", "Bin & dumpster rentals", ["bin rental", "dumpster"]),
        t("yard-waste", "Yard waste", ["yard waste"]),
        t("electronics-recycling", "Electronics recycling", ["electronics", "e-waste"]),
      ]},
      { slug: "moving-downsizing", name: "Moving & Downsizing", topics: [
        t("moving-services", "Movers", ["movers", "moving company", "moving"]),
        t("estate-cleanouts", "Estate cleanouts", ["estate cleanout", "estate"]),
        t("packing-storage", "Packing & storage", ["packing", "storage"]),
        t("downsizing-help", "Downsizing help", ["downsizing", "seniors move"]),
      ]},
      { slug: "cleaning-maintenance", name: "Cleaning & Maintenance", topics: [
        t("house-cleaning", "House cleaning", ["cleaning", "cleaners"]),
        t("pressure-washing", "Pressure washing", ["pressure washing", "power washing"]),
        t("gutter-window", "Gutters & windows", ["gutter", "window cleaning"]),
        t("pest-control", "Pest control", ["pest control", "exterminator"]),
      ]},
    ],
  },
  {
    slug: "construction-renovation", name: "Construction & Renovation", blurb: "Building, renovating and site cleanup.",
    subdivisions: [
      { slug: "debris-site-cleanup", name: "Debris & Site Cleanup", topics: [
        t("construction-debris", "Construction debris", ["construction debris", "renovation debris"]),
        t("demolition-cleanup", "Demolition cleanup", ["demolition cleanup", "demolition"]),
      ]},
      { slug: "renovation-contractors", name: "Renovation Contractors", topics: [
        t("kitchen-bath-reno", "Kitchens & bathrooms", ["kitchen renovation", "bathroom renovation"]),
        t("flooring-painting", "Flooring & painting", ["flooring", "painting"]),
      ]},
      { slug: "structural-exterior", name: "Structural & Exterior", topics: [
        t("roofing", "Roofing", ["roofing", "roof repair"]),
        t("foundation-drainage", "Foundations & drainage", ["foundation", "drainage"]),
      ]},
      { slug: "site-services", name: "Excavation & Concrete", topics: [
        t("excavation", "Excavation", ["excavation", "excavating"]),
        t("concrete-works", "Concrete", ["concrete"]),
      ]},
    ],
  },
  {
    slug: "real-estate", name: "Real Estate", blurb: "Buying, selling, renting and property care.",
    subdivisions: [
      { slug: "buying-selling", name: "Buying & Selling", topics: [
        t("realtors", "Realtors", ["realtor", "real estate agent"]),
        t("home-valuation", "Home valuation", ["home value", "home appraisal"]),
      ]},
      { slug: "property-management", name: "Property Management", topics: [
        t("tenant-turnover", "Tenant turnover", ["tenant turnover", "eviction cleanout"]),
        t("strata-condo", "Strata & condo care", ["strata", "condo management", "property management"]),
      ]},
      { slug: "staging-prep", name: "Listing Preparation", topics: [
        t("home-staging", "Home staging", ["home staging", "staging"]),
        t("pre-listing-cleanout", "Pre-listing cleanout", ["pre-listing", "listing cleanout"]),
      ]},
      { slug: "inspections", name: "Inspections", topics: [
        t("home-inspection", "Home inspection", ["home inspection", "inspector"]),
      ]},
    ],
  },
  {
    slug: "transportation-moving", name: "Transportation & Moving", blurb: "Moving goods, vehicles and freight.",
    subdivisions: [
      { slug: "movers-transport", name: "Movers & Transport", topics: [
        t("local-movers", "Local movers", ["local movers"]),
        t("long-distance-movers", "Long-distance movers", ["long distance movers", "interprovincial movers"]),
      ]},
      { slug: "vehicle-transport", name: "Vehicle Transport", topics: [
        t("car-shipping", "Car shipping", ["car shipping", "vehicle transport"]),
        t("towing", "Towing", ["towing", "tow truck"]),
      ]},
      { slug: "freight-courier", name: "Freight & Courier", topics: [
        t("freight", "Freight", ["freight", "ltl shipping"]),
        t("courier-delivery", "Courier delivery", ["courier", "delivery service"]),
      ]},
    ],
  },
  {
    slug: "automotive", name: "Automotive", blurb: "Cars, trucks and everything that keeps them going.",
    subdivisions: [
      { slug: "repair-maintenance", name: "Repair & Maintenance", topics: [
        t("auto-repair", "Auto repair", ["auto repair", "mechanic"]),
        t("oil-tires", "Oil & tires", ["oil change", "tires"]),
      ]},
      { slug: "vehicle-disposal", name: "Vehicle Disposal", topics: [
        t("scrap-car", "Scrap car removal", ["scrap car", "junk car"]),
        t("tire-disposal", "Tire disposal", ["tire disposal", "old tires"]),
      ]},
      { slug: "parts-detailing", name: "Parts & Detailing", topics: [
        t("auto-parts", "Auto parts", ["auto parts", "car parts"]),
        t("car-detailing", "Detailing", ["car detailing", "car wash"]),
      ]},
    ],
  },
  {
    slug: "retail-shopping", name: "Retail & Shopping", blurb: "Where Canadians buy, sell and give things a second life.",
    subdivisions: [
      { slug: "home-goods", name: "Furniture & Appliances", topics: [
        t("furniture-stores", "Furniture stores", ["furniture store", "buy furniture"]),
        t("appliance-stores", "Appliance stores", ["appliance store", "buy appliance"]),
      ]},
      { slug: "secondhand-donation", name: "Second-hand & Donation", topics: [
        t("used-furniture", "Used furniture", ["used furniture", "thrift"]),
        t("donation-pickup", "Donation pickup", ["donation pickup", "donate"]),
      ]},
      { slug: "delivery-installation", name: "Delivery & Installation", topics: [
        t("big-item-delivery", "Big-item delivery", ["appliance delivery", "furniture delivery"]),
      ]},
    ],
  },
  {
    slug: "health-wellness", name: "Health & Wellness", blurb: "Care for people, at home and in clinics.",
    subdivisions: [
      { slug: "clinics-care", name: "Clinics & Care", topics: [
        t("walk-in-clinic", "Walk-in clinics", ["walk in clinic", "clinic near me"]),
        t("dental-care", "Dental", ["dentist", "dental"]),
      ]},
      { slug: "home-support", name: "Home Support", topics: [
        t("home-care", "Home care", ["home care", "caregiver"]),
        t("medical-equipment", "Medical equipment", ["medical equipment", "mobility aids"]),
      ]},
      { slug: "fitness", name: "Fitness", topics: [
        t("gyms-fitness", "Gyms & fitness", ["gym", "fitness class"]),
      ]},
    ],
  },
  {
    slug: "education-training", name: "Education & Training", blurb: "Learning for kids, adults and trades.",
    subdivisions: [
      { slug: "tutoring-childcare", name: "Tutoring & Childcare", topics: [
        t("tutoring", "Tutoring", ["tutor", "tutoring"]),
        t("childcare", "Childcare", ["daycare", "childcare"]),
      ]},
      { slug: "trades-training", name: "Trades & Certification", topics: [
        t("trades-courses", "Trades courses", ["trades training", "apprenticeship"]),
        t("safety-certification", "Safety certificates", ["first aid course", "safety training"]),
      ]},
    ],
  },
  {
    slug: "finance-insurance", name: "Finance & Insurance", blurb: "Money, protection and planning.",
    subdivisions: [
      { slug: "mortgages-lending", name: "Mortgages & Lending", topics: [
        t("mortgage-rates", "Mortgage rates", ["mortgage rate", "mortgage"]),
        t("refinancing", "Refinancing", ["refinance", "renew mortgage"]),
      ]},
      { slug: "insurance", name: "Insurance", topics: [
        t("home-insurance", "Home insurance", ["home insurance", "tenant insurance"]),
        t("auto-insurance", "Auto insurance", ["auto insurance", "car insurance"]),
      ]},
      { slug: "accounting-tax", name: "Accounting & Tax", topics: [
        t("accountant", "Accountants", ["accountant", "bookkeeper"]),
        t("tax-filing", "Tax filing", ["tax return", "tax filing"]),
      ]},
    ],
  },
  {
    slug: "technology-digital", name: "Technology & Digital", blurb: "Connected homes, devices and software.",
    subdivisions: [
      { slug: "it-support", name: "IT & Support", topics: [
        t("computer-repair", "Computer repair", ["computer repair", "laptop repair"]),
        t("it-services", "IT services", ["it support", "managed it"]),
      ]},
      { slug: "web-software", name: "Web & Software", topics: [
        t("web-design", "Web design", ["web design", "website"]),
        t("business-software", "Business software", ["business software", "crm"]),
      ]},
      { slug: "smart-home", name: "Smart Home", topics: [
        t("smart-install", "Smart-home setup", ["smart home", "thermostat install"]),
      ]},
    ],
  },
  {
    slug: "professional-services", name: "Professional Services", blurb: "Expert help for business and life admin.",
    subdivisions: [
      { slug: "legal-notary", name: "Legal & Notary", topics: [
        t("lawyer", "Lawyers", ["lawyer", "legal advice"]),
        t("notary", "Notaries", ["notary", "commissioner"]),
      ]},
      { slug: "consulting-marketing", name: "Consulting & Marketing", topics: [
        t("business-consulting", "Consulting", ["business consultant"]),
        t("marketing-agency", "Marketing agencies", ["marketing agency", "seo services"]),
      ]},
    ],
  },
  {
    slug: "hospitality-events", name: "Hospitality & Events", blurb: "Gatherings, stays and celebrations.",
    subdivisions: [
      { slug: "catering-events", name: "Catering & Events", topics: [
        t("catering", "Catering", ["catering", "caterer"]),
        t("event-planning", "Event planning", ["event planner", "party planning"]),
      ]},
      { slug: "rentals-venues", name: "Rentals & Venues", topics: [
        t("party-rentals", "Party rentals", ["party rental", "tent rental"]),
        t("event-venues", "Event venues", ["event venue", "banquet hall"]),
      ]},
    ],
  },
  {
    slug: "agriculture-rural", name: "Agriculture & Rural", blurb: "Farms, land and rural property.",
    subdivisions: [
      { slug: "farm-services", name: "Farm Services", topics: [
        t("farm-labour", "Farm help", ["farm labour", "farmhand"]),
        t("land-clearing", "Land clearing", ["land clearing", "brush removal"]),
      ]},
      { slug: "farm-equipment", name: "Equipment & Supplies", topics: [
        t("equipment-repair", "Equipment repair", ["equipment repair", "implement"]),
        t("feed-supplies", "Feed & supplies", ["feed store", "farm supply"]),
      ]},
    ],
  },
  {
    slug: "manufacturing-industrial", name: "Manufacturing & Industrial", blurb: "Production, warehouses and heavy assets.",
    subdivisions: [
      { slug: "industrial-services", name: "Industrial Services", topics: [
        t("machining", "Machining & fabrication", ["machining", "fabrication", "welding"]),
        t("factory-equipment-removal", "Equipment removal", ["equipment removal", "machinery removal"]),
      ]},
      { slug: "warehousing-logistics", name: "Warehousing & Logistics", topics: [
        t("warehousing", "Warehousing", ["warehousing", "3pl"]),
        t("pallet-recycling", "Pallet recycling", ["pallet", "skid"]),
      ]},
    ],
  },
  {
    slug: "entertainment-media", name: "Entertainment & Media", blurb: "Leisure, content and creative work.",
    subdivisions: [
      { slug: "recreation", name: "Recreation", topics: [
        t("rec-activities", "Activities", ["recreation", "leisure"]),
        t("trails-outdoors", "Trails & outdoors", ["hiking", "camping"]),
      ]},
      { slug: "photo-video", name: "Photo & Video", topics: [
        t("photography", "Photography", ["photographer", "photo session"]),
        t("videography", "Videography", ["videographer", "video production"]),
      ]},
    ],
  },
  {
    slug: "community-other", name: "Community & Other Sectors", blurb: "Public services, nonprofits and everything else.",
    subdivisions: [
      { slug: "nonprofit-charity", name: "Nonprofits & Charity", topics: [
        t("charity-donation", "Charities", ["charity", "nonprofit"]),
        t("volunteering", "Volunteering", ["volunteer"]),
      ]},
      { slug: "pets-animals", name: "Pets & Animals", topics: [
        t("pet-services", "Pet services", ["dog walker", "pet sitting", "groomer"]),
        t("vet-clinics", "Vet clinics", ["vet", "veterinary"]),
      ]},
      { slug: "misc-local", name: "Other Local Services", topics: [
        t("misc-services", "Something else", ["other services"]),
      ]},
    ],
  },
];

// Extended matching keys per topic: the everyday phrases Canadians actually
// search. These are CLASSIFICATION KEYS ONLY — they never create demand.
const KEYWORD_EXTRA: Record<string, string[]> = {
  "junk-removal": ["garbage removal", "trash removal", "rubbish removal", "junk pick up", "junk pickup", "garage cleanout", "garage clean out", "basement cleanout", "decluttering", "clutter", "hoarding", "shed removal", "haul away", "hauler", "same day junk", "junk disposal", "get rid of"],
  "furniture-removal": ["couch", "sofa", "dresser", "old furniture", "couch removal", "sofa removal", "sectional", "recliner", "armchair", "wardrobe", "bed frame"],
  "appliance-removal": ["fridge", "refrigerator", "freezer", "washer", "dryer", "stove", "oven", "dishwasher", "microwave", "old appliances"],
  "mattress-disposal": ["boxspring", "box spring", "bed disposal", "old bed", "bedding"],
  "scrap-metal-pickup": ["copper", "brass", "aluminum", "steel", "metal pickup", "metal hauling", "radiators", "exercise equipment"],
  "hot-tub-removal": ["spa removal", "jacuzzi", "swim spa"],
  "waste-disposal": ["garbage", "trash", "rubbish", "waste management", "garbage pickup", "trash pickup", "waste removal"],
  "recycling-drop-off": ["recycle", "blue box", "blue bin", "bottle depot", "return-it", "depot", "recycling centre", "recycling center"],
  "bin-rentals": ["disposal bin", "garbage bin", "junk bin", "roll off", "rolloff", "waste container"],
  "yard-waste": ["green waste", "leaves", "branches", "grass", "garden waste", "brush", "lawn waste", "tree limbs"],
  "electronics-recycling": ["tv", "computers", "laptop", "printer", "monitor", "ewaste", "tv disposal", "computer disposal", "old electronics"],
  "moving-services": ["move", "relocation", "van lines", "moving out", "moving help", "residential moving"],
  "estate-cleanouts": ["house cleanout", "home cleanout", "estate sale", "probate cleanout"],
  "packing-storage": ["moving boxes", "self storage", "storage unit", "packing service"],
  "downsizing-help": ["seniors", "senior move", "empty nest"],
  "house-cleaning": ["maid", "house cleaner", "move out cleaning", "deep cleaning"],
  "pressure-washing": ["power wash", "driveway cleaning", "deck cleaning"],
  "gutter-window": ["gutters", "eavestrough", "window washing", "gutter cleaning"],
  "pest-control": ["exterminator", "mice", "ants", "wasps", "rodent"],
  "construction-debris": ["drywall", "lumber", "renovation waste", "construction waste", "reno debris", "plywood"],
  "demolition-cleanup": ["tear down", "demo cleanup", "garage demolition", "deck demolition", "fence removal"],
  "kitchen-bath-reno": ["kitchen remodel", "bathroom remodel", "reno contractor"],
  "flooring-painting": ["painters", "hardwood", "laminate", "tile"],
  "roofing": ["roof", "shingles", "roof replacement", "leaking roof"],
  "foundation-drainage": ["perimeter drain", "sump pump", "crack repair"],
  "excavation": ["excavating", "backhoe", "digging"],
  "concrete-works": ["driveway", "patio", "sidewalk"],
  "realtors": ["real estate agent", "realtor near me", "sell my house", "list my home"],
  "home-valuation": ["home appraisal", "house value", "cma"],
  "tenant-turnover": ["move out cleanout", "rental turnover", "eviction"],
  "strata-condo": ["property manager", "condo corporation"],
  "home-staging": ["staging", "home presentation"],
  "pre-listing-cleanout": ["listing cleanout", "sell ready", "showing ready"],
  "home-inspection": ["inspector", "home inspectors"],
  "local-movers": ["movers near me", "moving crew", "two men and a truck"],
  "long-distance-movers": ["cross country movers", "out of province moving"],
  "car-shipping": ["ship a car", "auto transport"],
  "towing": ["tow truck", "car towed"],
  "freight": ["ltl shipping", "pallet shipping", "trucking"],
  "courier-delivery": ["courier", "parcel delivery", "same day delivery"],
  "scrap-car": ["car removal", "junk car removal", "vehicle removal", "cash for cars", "end of life vehicle"],
  "tire-disposal": ["old tires", "tire recycling", "worn tires"],
  "auto-parts": ["car parts", "salvage parts", "used auto parts"],
  "car-detailing": ["car wash", "auto detailing", "interior detailing"],
  "auto-repair": ["mechanic", "check engine", "brake repair"],
  "oil-tires": ["oil change", "new tires", "tire rotation"],
  "furniture-stores": ["furniture store", "buy furniture", "couch store"],
  "appliance-stores": ["appliance store", "buy fridge", "new appliances"],
  "used-furniture": ["thrift", "consignment", "second hand furniture", "marketplace furniture"],
  "donation-pickup": ["donate", "charity pickup", "clothing donation", "furniture donation"],
  "big-item-delivery": ["appliance delivery", "furniture delivery", "white glove delivery"],
  "walk-in-clinic": ["clinic near me", "urgent care"],
  "dental-care": ["dentist", "dental cleaning", "orthodontist"],
  "home-care": ["caregiver", "senior care", "home support worker"],
  "medical-equipment": ["mobility aids", "wheelchair", "hospital bed", "walker"],
  "gyms-fitness": ["gym", "fitness class", "personal trainer", "yoga studio"],
  "tutoring": ["tutor", "math tutor", "homework help"],
  "childcare": ["daycare", "day care", "preschool", "nanny"],
  "trades-courses": ["apprenticeship", "trades training", "trade school"],
  "safety-certification": ["first aid course", "whmis", "fall protection"],
  "mortgage-rates": ["mortgage", "mortgage broker", "best mortgage rate"],
  "refinancing": ["refinance", "renew mortgage", "heloc"],
  "home-insurance": ["tenant insurance", "house insurance", "homeowners insurance"],
  "auto-insurance": ["car insurance", "icbc"],
  "accountant": ["bookkeeper", "cpa", "accounting firm"],
  "tax-filing": ["tax return", "file taxes", "t1", "gst filing"],
  "computer-repair": ["laptop repair", "screen repair", "virus removal"],
  "it-services": ["it support", "managed it", "it help"],
  "web-design": ["website", "web developer", "web hosting"],
  "business-software": ["crm", "erp", "business app"],
  "smart-install": ["smart home", "thermostat install", "doorbell camera"],
  "lawyer": ["legal advice", "attorney", "family law", "will and estate"],
  "notary": ["commissioner", "notarize document"],
  "business-consulting": ["business consultant", "business plan", "coach"],
  "marketing-agency": ["seo services", "digital marketing", "ads agency"],
  "catering": ["caterer", "food catering", "party food"],
  "event-planning": ["event planner", "wedding planner", "party planning"],
  "party-rentals": ["tent rental", "table rental", "chair rental", "bounce house"],
  "event-venues": ["banquet hall", "wedding venue", "event space"],
  "farm-labour": ["farmhand", "farm worker", "harvest help"],
  "land-clearing": ["brush removal", "tree removal", "stump removal", "bush clearing"],
  "equipment-repair": ["implement repair", "tractor repair", "combine repair"],
  "feed-supplies": ["feed store", "farm supply", "seed and feed"],
  "machining": ["fabrication", "welding", "cnc", "metal work"],
  "factory-equipment-removal": ["machinery removal", "equipment removal", "industrial removal", "conveyor removal"],
  "warehousing": ["3pl", "storage warehouse", "distribution"],
  "pallet-recycling": ["pallets", "skids", "pallet removal"],
  "rec-activities": ["recreation", "leisure", "drop in"],
  "trails-outdoors": ["hiking", "camping", "parks"],
  "photography": ["photographer", "photo session", "family photos"],
  "videography": ["videographer", "video production"],
  "charity-donation": ["donation", "nonprofit", "give away"],
  "volunteering": ["volunteer", "community service"],
  "pet-services": ["dog walker", "pet sitting", "groomer", "dog training", "pet grooming"],
  "vet-clinics": ["veterinary", "animal hospital", "vet near me"],
  "misc-services": ["handyman", "odd jobs", "other services", "not sure"],
};

export function flattenTaxonomy() {
  const rows: any[] = [];
  INDUSTRY_TAXONOMY.forEach((ind, i) => {
    rows.push({ slug: ind.slug, level: "industry", parent_slug: "", name: ind.name, order: i });
    ind.subdivisions.forEach((sub, j) => {
      rows.push({ slug: sub.slug, level: "subdivision", parent_slug: ind.slug, name: sub.name, order: j });
      sub.topics.forEach((topic, k) => {
        rows.push({ slug: topic.slug, level: "topic", parent_slug: sub.slug, name: topic.name, keywords: [...topic.keywords, ...(KEYWORD_EXTRA[topic.slug] || [])], order: k });
      });
    });
  });
  return rows;
}