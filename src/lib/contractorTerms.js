// Centralized contractor network terms — single source of truth for the
// membership comparison page, the contractor portal and admin reviews.
// These mirror the already-published terms in the network pitch; nothing here
// is new policy, and no guaranteed job volumes, exclusive territories or
// revenue commitments appear anywhere in this file.

export const MEMBERSHIP_TIERS = [
  { name: "Small markets", monthly: 349, market: "Towns and smaller regional cities" },
  { name: "Standard cities", monthly: 499, market: "Mid-size cities with solid search volume", featured: true },
  { name: "Metro territories", monthly: 999, market: "Major metros — full network push" },
];

export const ACTIVATION = {
  label: "One-time territory activation",
  range: "$250–$500",
  note: "Covers building and launching your territory pages. Charged once at setup — not recurring.",
};

export const BILLING = {
  frequency: "Monthly",
  method: "PayPal subscription, billed monthly",
  note: "Every fee is disclosed in writing before you accept any agreement. Commissions are NOT automatic — they apply only if your written agreement says so, and only for the job sources it lists.",
};

export const INCLUDED = [
  "Territory city page plus service pages (furniture, appliance, estate cleanouts, condo & strata, office cleanouts, metal pickup) — written, maintained and kept ranking by the network",
  "Live booking tracker: every booking in your territory on one screen, in real time",
  "AI follow-ups that chase every lead until it books",
  "SEO insights and realtime traffic for your territory",
  "Platform-generated job opportunities dropped to your dispatch dashboard, with fees disclosed before you accept",
  "Membership seats are capped per market to keep job flow healthy for every member",
];

export const LIMITATIONS = [
  "No guaranteed number of jobs, earnings or any particular operational result is promised",
  "Territories are membership seats in a shared market — not exclusive rights",
  "Territory pages stay on the platform's domain",
  "Lead flow depends on customer demand in your city",
  "You bill the customer directly; the network never touches your job revenue",
];

export const CANCELLATION = [
  "Cancel any time with written notice",
  "Your territory reopens for the next partner when your agreement ends",
  "Agreements default to 30 days' cancellation notice unless your written agreement states otherwise",
];

export const OWNERSHIP_RULES = [
  "Contractors retain their independently acquired customers — the network adds volume; it never takes your book.",
  "Network-acquired customers follow the applicable network relationship agreement — nothing changes for customers you source yourself.",
  "Membership does not automatically grant territorial exclusivity — territories are shared-market membership seats.",
  "Dispatch and referral fees must be disclosed before job acceptance — never a default charge, and never applied to jobs you source yourself.",
  "Contractors retain operational independence — you own your truck and crew, set your own rates above the network floor, subject to your applicable agreement.",
];

export const EXIT_PROCEDURES = [
  "Notice: written cancellation notice to the network (agreement default: 30 days) ends the membership at the close of the notice period.",
  "Billing stops: the monthly PayPal subscription is cancelled at the end of the notice period; no further membership charges apply after that date.",
  "Open jobs: jobs already accepted and scheduled are completed as agreed; no new jobs are offered after notice is given.",
  "Territory release: your territory page seats reopen for the next partner when your agreement ends.",
];

export const DATA_EXPORT = [
  "Your customer and job records for jobs you sourced or completed are exportable at any time, on request, in standard formats (CSV/JSON).",
  "Network-generated customer data remains subject to the network relationship agreement after exit.",
  "Request an export from the network at any time — including after cancellation — and it is provided within a reasonable period.",
];

export const REGIONS = "Canadian cities, tiered by market size (small market, standard city, metro). Territory availability depends on open membership seats per market.";