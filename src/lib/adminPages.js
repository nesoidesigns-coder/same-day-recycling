// Internal page registry — the single source of truth for navigation.
// Every entry maps to a route that actually exists in src/App.jsx, or is
// flagged as an orphan (a page file with no registered route).
//
// status  = routing status, verified against the route registry:
//   "active"   — routed and reachable
//   "unlinked" — routed but not previously reachable from any menu
//   "orphan"   — page file exists but has no registered route
//   "alias"    — same page reachable at a second path (kept for old links)
// role     — who may open it (admin pages additionally enforce the admin role
//            in the admin shell; public pages are open).
// sources  — entities/functions the page reads.

export const SECTIONS = [
  { key: "command", label: "Command Centre", hint: "Live network, dispatch and executive overview" },
  { key: "customer", label: "Customer Business", hint: "Market A — people buying removal services" },
  { key: "contractor", label: "Contractor Business", hint: "Market B — operators buying the platform" },
  { key: "market", label: "Market Intelligence", hint: "Demand evidence, search and growth" },
  { key: "platform", label: "Platform Management", hint: "Settings, pricing, integrity and system" },
];

export const PAGES = [
  // ---------------- Command Centre ----------------
  { path: "/admin", name: "Command Overview", purpose: "Both businesses on one screen: service work, contractor software and combined platform", role: "admin", section: "command", status: "active", sources: ["Booking", "Partner", "SoftwareLicense", "visitStats"] },
  { path: "/admin/gauges", name: "Gauge Wall", purpose: "Every defined operating metric in one wall", role: "admin", section: "command", status: "active", sources: ["Booking", "Partner"] },
  { path: "/admin/ops", name: "Live Operations", purpose: "Real-time job and dispatch activity", role: "admin", section: "command", status: "active", sources: ["Booking", "TrackingEvent"] },
  { path: "/admin/national", name: "National Operations", purpose: "Requests, dispatch settings and contractor recruitment nationally", role: "admin", section: "command", status: "active", sources: ["NationalRequest", "DispatchSettings", "ProviderRecruit"] },
  { path: "/admin/jobs", name: "Jobs & Dispatch", purpose: "Every job: assignment, schedule, completion and payment", role: "admin", section: "command", status: "active", sources: ["Booking", "Partner"] },
  { path: "/admin/assignments", name: "Assignments", purpose: "Match unassigned jobs to verified contractor capacity", role: "admin", section: "command", status: "active", sources: ["Booking", "Partner", "DispatchTask"] },
  { path: "/admin/routes", name: "Route Intelligence", purpose: "Planned routes and daily run optimisation", role: "admin", section: "command", status: "active", sources: ["RoutePlan", "Booking"] },
  { path: "/admin/bi", name: "Live Business Intelligence", purpose: "Cross-business performance readings", role: "admin", section: "command", status: "active", sources: ["Booking", "Partner", "Visit"] },
  { path: "/admin/growth-command", name: "Owner Command Centre", purpose: "Owner-level decisions and escalations", role: "admin", section: "command", status: "active", sources: ["GrowthDecision", "Improvement"] },

  // ---------------- Customer Business (Market A) ----------------
  { path: "/admin/leads", name: "Leads", purpose: "Inbound customer enquiries waiting for a response", role: "admin", section: "customer", status: "active", sources: ["QuoteLead", "Booking", "NationalRequest"] },
  { path: "/admin/pipeline", name: "Lead Pipeline", purpose: "Enquiry → quote → booking progress board", role: "admin", section: "customer", status: "active", sources: ["Booking", "QuoteLead"] },
  { path: "/admin/acquisition", name: "Customer Acquisition", purpose: "Where service customers come from", role: "admin", section: "customer", status: "active", sources: ["Visit", "Booking"] },
  { path: "/admin/conversion", name: "Conversion Funnel", purpose: "Visit → quote → booking drop-off", role: "admin", section: "customer", status: "active", sources: ["Visit", "QuoteLead", "Booking"] },
  { path: "/admin/sales", name: "Sales Intelligence", purpose: "Quote and job economics for service work", role: "admin", section: "customer", status: "active", sources: ["Booking", "JobFinancials"] },
  { path: "/admin/revenue", name: "Revenue Intelligence", purpose: "Job-level money: gross value, commission, expenses", role: "admin", section: "customer", status: "active", sources: ["Booking", "JobFinancials", "ChangeOrder"] },
  { path: "/admin/payouts", name: "Contractor Payouts", purpose: "What each operator is owed and what has been paid", role: "admin", section: "customer", status: "active", sources: ["Booking", "FinancialTx"] },
  { path: "/admin/disputes", name: "Disputes", purpose: "Customer disagreements and resolutions", role: "admin", section: "customer", status: "active", sources: ["Dispute"] },
  { path: "/admin/reputation", name: "Reputation", purpose: "Reviews, ratings and follow-up health", role: "admin", section: "customer", status: "active", sources: ["Review", "GoogleReview"] },
  { path: "/admin/gbp", name: "GBP Funnel", purpose: "Google Business Profile enquiries into jobs", role: "admin", section: "customer", status: "active", sources: ["GbpPipeline (function)"] },
  { path: "/admin/analytics", name: "Analytics", purpose: "Traffic, sources and on-site behaviour", role: "admin", section: "customer", status: "active", sources: ["Visit", "visitStats"] },
  { path: "/admin/community", name: "Community", purpose: "Member posts and moderation", role: "admin", section: "customer", status: "active", sources: ["CommunityPost", "CommunityReport"] },
  { path: "/admin/ads", name: "Community Ads", purpose: "Community advertising inventory", role: "admin", section: "customer", status: "active", sources: ["CommunityAd", "AdNetworkSettings"] },
  { path: "/admin/publisher", name: "Community Publisher", purpose: "Automated community content publishing", role: "admin", section: "customer", status: "unlinked", sources: ["CommunityDraft", "CommunityPublisherSettings"] },
  { path: "/admin/marketing", name: "Marketing Hub", purpose: "Campaigns, content and social distribution", role: "admin", section: "customer", status: "active", sources: ["SocialPostDraft", "ContentPost"] },
  { path: "/admin/marketing-command", name: "Marketing Command", purpose: "Marketing decisions ranked by expected value", role: "admin", section: "customer", status: "active", sources: ["marketingCommand (function)"] },
  { path: "/admin/facebook", name: "Facebook AI", purpose: "Page posts, replies and insights", role: "admin", section: "customer", status: "active", sources: ["FacebookSettings", "facebookInsights (function)"] },
  { path: "/admin/sms", name: "SMS Inbox", purpose: "Two-way customer texting", role: "admin", section: "customer", status: "active", sources: ["SmsMessage", "SmsSettings"] },
  { path: "/admin/franchise-review", name: "Franchise Review", purpose: "Location-level performance review", role: "admin", section: "customer", status: "active", sources: ["FranchiseReview"] },

  // ---------------- Contractor Business (Market B) ----------------
  { path: "/admin/partners", name: "Contractor Accounts", purpose: "The contractor CRM: profile, territory, capacity, plan", role: "admin", section: "contractor", status: "active", sources: ["Partner", "ContractorAgreement", "Booking"] },
  { path: "/admin/applications", name: "Contractor Applications", purpose: "Incoming operator applications and vetting", role: "admin", section: "contractor", status: "unlinked", sources: ["ContractorApplication"] },
  { path: "/admin/contractor-acquisition", name: "Contractor Acquisition", purpose: "Recruiting operators into regions with demand", role: "admin", section: "contractor", status: "active", sources: ["ContractorApplication", "ProviderRecruit", "DemandSignal"] },
  { path: "/admin/contractor-ops", name: "Contractor Operations", purpose: "Fulfilment health: acceptance, punctuality, completion", role: "admin", section: "contractor", status: "active", sources: ["Booking", "Partner"] },
  { path: "/admin/agreements", name: "Contractor Agreements", purpose: "Fee terms, territory memberships and acceptance", role: "admin", section: "contractor", status: "active", sources: ["ContractorAgreement"] },
  { path: "/admin/software", name: "Software Customers", purpose: "Recycling OS licences: plans, billing, provisioning", role: "admin", section: "contractor", status: "unlinked", sources: ["SoftwareLicense", "LicenseInvoice", "SoftwareInquiry"] },
  { path: "/admin/white-label", name: "White Label", purpose: "Operators running the platform under their own brand", role: "admin", section: "contractor", status: "active", sources: ["WhiteLabelClient", "WhiteLabelLead"] },
  { path: "/admin/growth-engine", name: "Network Growth Engine", purpose: "Growth fund, campaign capacity and contractor contributions", role: "admin", section: "contractor", status: "active", sources: ["NetworkGrowthSettings", "NetworkCampaign", "MarketingContribution"] },
  { path: "/admin/gallery", name: "Fleet Gallery", purpose: "Operator and job photography", role: "admin", section: "contractor", status: "active", sources: ["GalleryPhoto"] },
  { path: "/partners", name: "Contractor Portal", purpose: "A contractor's own dashboard: jobs, earnings, offers", role: "contractor", section: "contractor", status: "active", sources: ["partnerPortal (function)", "Booking"] },
  { path: "/partner-register", name: "Partner Registration", purpose: "Contractor sign-up entry point", role: "public", section: "contractor", status: "active", sources: ["Partner"] },
  { path: "/contractor-onboarding", name: "Contractor Onboarding", purpose: "Document and compliance onboarding", role: "public", section: "contractor", status: "active", sources: ["ContractorApplication"] },
  { path: "/contractor-membership", name: "Membership Comparison", purpose: "Plan comparison for prospective operators", role: "public", section: "contractor", status: "active", sources: [] },
  { path: "/contractors", name: "Contractor Marketing Page", purpose: "Public pitch to prospective operators", role: "public", section: "contractor", status: "active", sources: [] },

  // ---------------- Market Intelligence ----------------
  { path: "/admin/demand", name: "Market Intelligence", purpose: "Verified demand observations and Rex's analysis", role: "admin", section: "market", status: "active", sources: ["DemandObservation", "DemandInsight", "demandReport (function)"] },
  { path: "/admin/observatory", name: "Demand Observatory", purpose: "National signal map and review queue", role: "admin", section: "market", status: "active", sources: ["DemandSignal", "demandSignalEngine (function)"] },
  { path: "/admin/discovery", name: "Opportunity Discovery", purpose: "Public requests and source-backed opportunities", role: "admin", section: "market", status: "active", sources: ["PublicOpportunity", "DiscoveryRun"] },
  { path: "/admin/intelligence", name: "Brand & Market Intelligence", purpose: "Brand scanning and market context", role: "admin", section: "market", status: "active", sources: ["BrandScan", "CompetitorPricing"] },
  { path: "/admin/search-intelligence", name: "Search Intelligence", purpose: "Query-level search performance", role: "admin", section: "market", status: "active", sources: ["searchConsoleKeywords (function)"] },
  { path: "/admin/search-authority", name: "Search Authority", purpose: "Indexing coverage and content authority", role: "admin", section: "market", status: "active", sources: ["CrawlAudit", "SeoPerformanceSnapshot"] },
  { path: "/admin/keywords", name: "Search Keywords", purpose: "Tracked keyword set and positions", role: "admin", section: "market", status: "active", sources: ["SeoRecommendation", "searchConsoleKeywords"] },
  { path: "/admin/seo", name: "SEO Command", purpose: "Metadata recommendations awaiting approval", role: "admin", section: "market", status: "active", sources: ["SeoRecommendation", "SeoChangeLog"] },
  { path: "/admin/seo-action", name: "SEO Action Engine", purpose: "Applies approved metadata with rollback", role: "admin", section: "market", status: "active", sources: ["SeoChangeLog", "seoActionEngine (function)"] },
  { path: "/admin/growth", name: "Growth Intelligence", purpose: "Ranked growth opportunities", role: "admin", section: "market", status: "active", sources: ["GrowthDecision"] },
  { path: "/admin/improvements", name: "Improvement Queue", purpose: "Platform and site fixes with measured effect", role: "admin", section: "market", status: "active", sources: ["Improvement"] },
  { path: "/admin/business-master", name: "AI Business Master", purpose: "Long-range business modelling and memory", role: "admin", section: "market", status: "active", sources: ["BusinessMemory", "businessMaster (function)"] },

  // ---------------- Platform Management ----------------
  { path: "/admin/system", name: "System Administration", purpose: "Integrations, credentials and platform health", role: "admin", section: "platform", status: "active", sources: ["systemHealth (function)"] },
  { path: "/admin/integrity", name: "Platform Integrity", purpose: "Data-integrity sweeps and findings", role: "admin", section: "platform", status: "active", sources: ["IntegrityRun", "platformIntegrity (function)"] },
  { path: "/admin/pricing", name: "Pricing", purpose: "Service pricing rules and city pricing", role: "admin", section: "platform", status: "active", sources: ["PricingSettings", "CitySeo"] },
  { path: "/admin/cities", name: "City Management", purpose: "City pages, regions and coverage metadata", role: "admin", section: "platform", status: "active", sources: ["CitySeo", "CityRules"] },
  { path: "/admin/reviews", name: "Review Moderation", purpose: "Approve or hide submitted reviews", role: "admin", section: "platform", status: "active", sources: ["Review"] },
  { path: "/admin/directory", name: "Recycling Directory", purpose: "Recycling centre listing moderation", role: "admin", section: "platform", status: "unlinked", sources: ["Provider", "ListingReport"] },
  { path: "/admin/all-pages", name: "All Pages", purpose: "Every page in the platform, searchable", role: "admin", section: "platform", status: "active", sources: [] },
  { path: "/finance", name: "Finance Dashboard", purpose: "Ledger, taxes and expense reconciliation", role: "admin", section: "platform", status: "unlinked", sources: ["FinancialTx", "JobFinancials"] },
  { path: "/company", name: "Company Dashboard", purpose: "Company-level financial position", role: "admin", section: "platform", status: "unlinked", sources: ["FinancialTx", "RevenueLedger"] },

  // ---------------- Public service site (Market A) ----------------
  { path: "/", name: "Home", purpose: "Service marketing front door", role: "public", section: "public", status: "active", sources: [] },
  { path: "/request-service", name: "Request Service", purpose: "Customer pickup request intake", role: "public", section: "public", status: "active", sources: ["NationalRequest"] },
  { path: "/request-status", name: "Request Status", purpose: "Customer lookup by reference code", role: "public", section: "public", status: "active", sources: ["requestLookup (function)"] },
  { path: "/track", name: "Track Job", purpose: "Public job tracking by code", role: "public", section: "public", status: "active", sources: ["TrackingEvent"] },
  { path: "/pricing", name: "Pricing", purpose: "Published service pricing", role: "public", section: "public", status: "active", sources: ["PricingSettings"] },
  { path: "/services", name: "Explore Services", purpose: "Service catalogue", role: "public", section: "public", status: "active", sources: [] },
  { path: "/service-finder", name: "Service Finder", purpose: "Guided service selection", role: "public", section: "public", status: "active", sources: [] },
  { path: "/coverage", name: "Coverage", purpose: "Where service is available", role: "public", section: "public", status: "active", sources: ["Partner", "coverageStatus (function)"] },
  { path: "/region/:code", name: "Province Page", purpose: "Provincial service landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/:pageSlug", name: "City / Service Page", purpose: "Per-city and per-service landing pages", role: "public", section: "public", status: "active", sources: ["CitySeo", "ServicePageMeta"] },
  { path: "/move-assist", name: "MoveAssist", purpose: "Multi-stage move cleanout planning", role: "public", section: "public", status: "active", sources: ["MoveAssistProject"] },
  { path: "/move-assist/dashboard", name: "MoveAssist Dashboard", purpose: "Customer's own move project tracker", role: "public", section: "public", status: "active", sources: ["MoveAssistProject"] },
  { path: "/ai-booking", name: "AI Booking Centre", purpose: "Conversational booking", role: "public", section: "public", status: "active", sources: ["aiBooking (function)"] },
  { path: "/impact-calculator", name: "Impact Calculator", purpose: "Recycling impact estimate", role: "public", section: "public", status: "active", sources: [] },
  { path: "/live", name: "Live Centre", purpose: "Public live service activity", role: "public", section: "public", status: "active", sources: ["liveIntelligence (function)"] },
  { path: "/recycling", name: "Recycling Directory", purpose: "Public recycling centre directory", role: "public", section: "public", status: "active", sources: ["RecyclingCenter"] },
  { path: "/recycling-centers", name: "Recycling Centres", purpose: "Centre map and details", role: "public", section: "public", status: "active", sources: ["RecyclingCenter"] },
  { path: "/recycling-assistant", name: "Recycling Assistant", purpose: "Disposal guidance assistant", role: "public", section: "public", status: "active", sources: ["recyclingAssistant (function)"] },
  { path: "/community", name: "Community", purpose: "Member community hub", role: "public", section: "public", status: "active", sources: ["CommunityPost"] },
  { path: "/demand", name: "Demand Page", purpose: "Public national demand view", role: "public", section: "public", status: "active", sources: ["DemandSignal"] },
  { path: "/blog", name: "Blog", purpose: "Content index", role: "public", section: "public", status: "active", sources: ["ContentPost"] },
  { path: "/blog/:slug", name: "Blog Post", purpose: "Individual article", role: "public", section: "public", status: "active", sources: ["ContentPost"] },
  { path: "/gallery", name: "Gallery", purpose: "Public job photography", role: "public", section: "public", status: "active", sources: ["GalleryPhoto"] },
  { path: "/about", name: "About", purpose: "Company information", role: "public", section: "public", status: "active", sources: [] },
  { path: "/contact", name: "Contact", purpose: "Contact and enquiry form", role: "public", section: "public", status: "active", sources: ["contactForm (function)"] },
  { path: "/review", name: "Leave a Review", purpose: "Customer review submission", role: "public", section: "public", status: "active", sources: ["Review"] },
  { path: "/subscriptions", name: "Business Subscriptions", purpose: "Recurring pickup plans for businesses", role: "public", section: "public", status: "active", sources: ["Subscription"] },
  { path: "/software", name: "Software Sales", purpose: "Recycling OS licence sales", role: "public", section: "public", status: "active", sources: ["SoftwareLicense"] },
  { path: "/white-label", name: "White Label Sales", purpose: "Own-brand platform offer", role: "public", section: "public", status: "active", sources: ["WhiteLabelLead"] },
  { path: "/property-managers", name: "Property Managers", purpose: "Segment landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/realtors", name: "Realtors", purpose: "Realtor partnership landing", role: "public", section: "public", status: "active", sources: [] },
  { path: "/real-estate", name: "Real Estate Landing", purpose: "Alternate realtor entry page", role: "public", section: "public", status: "active", sources: ["RealtorLead"] },
  { path: "/realtor-partners", name: "Realtor One-Pager", purpose: "Referral programme summary", role: "public", section: "public", status: "active", sources: [] },
  { path: "/realtor-dashboard", name: "Realtor Dashboard", purpose: "Referring realtor's own leads", role: "admin", section: "customer", status: "unlinked", sources: ["RealtorLead"] },
  { path: "/free-metal-pickup", name: "Free Metal Pickup", purpose: "Metal recovery landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/furniture-removal", name: "Furniture Removal", purpose: "Service landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/appliance-removal", name: "Appliance Removal", purpose: "Service landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/electronics-recycling", name: "Electronics Recycling", purpose: "Service landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/commercial-recycling", name: "Commercial Recycling", purpose: "Commercial segment landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/same-day-pickup", name: "Same Day Pickup", purpose: "Speed-focused landing page", role: "public", section: "public", status: "active", sources: [] },
  { path: "/privacy", name: "Privacy Policy", purpose: "Legal", role: "public", section: "public", status: "active", sources: [] },
  { path: "/terms", name: "Terms of Service", purpose: "Legal", role: "public", section: "public", status: "active", sources: [] },
  { path: "/license-agreement", name: "License Agreement", purpose: "Software licence terms", role: "public", section: "public", status: "active", sources: [] },
  { path: "/change-order", name: "Change Order Response", purpose: "Customer approves or declines job additions", role: "public", section: "public", status: "active", sources: ["ChangeOrder"] },
  { path: "/membership-pay", name: "Membership Payment", purpose: "Contractor membership settlement", role: "public", section: "contractor", status: "active", sources: ["ContractorAgreement", "paypalCheckout (function)"] },
  { path: "/software-pay", name: "Software Payment", purpose: "Licence settlement", role: "public", section: "contractor", status: "active", sources: ["SoftwareLicense"] },
  { path: "/white-label-pay", name: "White Label Payment", purpose: "Own-brand platform settlement", role: "public", section: "contractor", status: "active", sources: ["WhiteLabelClient"] },
  { path: "/software/start", name: "Software Onboarding", purpose: "Licence onboarding steps", role: "public", section: "contractor", status: "active", sources: ["SoftwareLicense"] },

  // ---------------- Auth ----------------
  { path: "/login", name: "Login", purpose: "Sign in", role: "public", section: "public", status: "active", sources: [] },
  { path: "/register", name: "Register", purpose: "Create an account", role: "public", section: "public", status: "active", sources: [] },
  { path: "/forgot-password", name: "Forgot Password", purpose: "Password reset request", role: "public", section: "public", status: "active", sources: [] },
  { path: "/reset-password", name: "Reset Password", purpose: "Set a new password", role: "public", section: "public", status: "active", sources: [] },

  // ---------------- Prototypes / not linked (kept, not promoted) ----------------
  { path: "/recycling-os", name: "Recycling OS (concept)", purpose: "Design prototype — not a business surface", role: "public", section: "prototypes", status: "hidden", sources: [] },
  { path: "/adi", name: "ADi Concept", purpose: "Design prototype — not a business surface", role: "public", section: "prototypes", status: "hidden", sources: [] },
  { path: "/prototype", name: "Connected Concept", purpose: "Design prototype — not a business surface", role: "public", section: "prototypes", status: "hidden", sources: [] },
  { path: "/prototype-observatory", name: "Observatory Concept", purpose: "Design prototype — not a business surface", role: "public", section: "prototypes", status: "hidden", sources: [] },
  { path: "/prototype-service-intelligence", name: "Service Intelligence (live home)", purpose: "Same page as / — kept for old links", role: "public", section: "prototypes", status: "alias", sources: [] },
  { path: "/city/:cityName", name: "City Redirect", purpose: "Legacy city URL redirected to the current city page", role: "public", section: "public", status: "alias", sources: [] },
  { path: "/provider/:id", name: "Provider Detail", purpose: "Directory listing detail page", role: "public", section: "public", status: "active", sources: ["Provider"] },
  { path: "/community/member/:profileId", name: "Member Profile", purpose: "Public community member profile", role: "public", section: "public", status: "active", sources: ["CommunityProfile", "CommunityPost"] },
];

// Pages rendered by the admin shell's five sections (menus never show the rest).
export const ADMIN_SECTIONS = SECTIONS;

export const pagesBySection = (section) => PAGES.filter((p) => p.section === section);

export const findPage = (pathname) => {
  if (!pathname) return null;
  const exact = PAGES.find((p) => p.path === pathname);
  if (exact) return exact;
  // longest matching prefix for routes with parameters
  return (
    PAGES.filter((p) => p.path !== "/" && pathname.startsWith(p.path.replace(/:[^/]+/g, "")))
      .sort((a, b) => b.path.length - a.path.length)[0] || null
  );
};

// Nav visibility for the admin sidebar: routed, admin-facing, not a prototype.
// Two owner pages render outside the admin shell but belong in its menu.
const OWNER_PATHS = ["/finance", "/company"];
export const NAV_SECTIONS = ["command", "customer", "contractor", "market", "platform"];
export const navPages = (section) =>
  pagesBySection(section).filter(
    (p) => p.role === "admin" && p.status !== "orphan" && (p.path.startsWith("/admin") || OWNER_PATHS.includes(p.path)),
  );