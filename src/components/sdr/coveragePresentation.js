// One national coverage standard — the four public states, applied
// identically on every customer-facing surface. Labels are the platform's
// official wording; do not restate availability differently elsewhere.
export const COVERAGE_COPY = {
  same_day: { frLabel: "Fournisseur disponible", label: "Provider Available", note: "A verified contractor currently serves this territory, subject to scheduling and job acceptance.", tone: "text-market-accent", fr: "Territoire d'un fournisseur vérifié. L'entrepreneur doit encore accepter votre travail, le prix et la plage horaire." },
  matching: { frLabel: "Recherche d'un entrepreneur en cours", label: "Contractor Matching", note: "Customers can submit requests, but fulfillment is not yet confirmed. No appointment is confirmed.", tone: "text-brand-amber", fr: "Recherche d'un entrepreneur en cours pour une demande ouverte. Aucun rendez-vous n'est confirmé." },
  recruiting: { frLabel: "Jumelage de fournisseurs disponible", label: "Provider Matching Available", note: "Requests are accepted here and a qualified local provider is sourced for each request. No contractor is secured in advance.", tone: "text-market-muted", fr: "Les demandes sont acceptées et un fournisseur local qualifié est recherché pour chaque demande." },
  currently_unavailable: { frLabel: "Demande de service", label: "Request Service", note: "No provider is on file here yet — submit your request and provider sourcing starts immediately.", tone: "text-market-muted", fr: "Soumettez votre demande; la recherche d'un fournisseur local commence immédiatement." },
};

// The single consistent availability message used across the website.
export const NATIONAL_COVERAGE_MESSAGE =
  "Request junk removal anywhere in Canada. Same-day service is subject to confirmed local provider availability.";