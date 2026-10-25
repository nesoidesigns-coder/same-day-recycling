// One national coverage standard — the four public states, applied
// identically on every customer-facing surface. Labels are the platform's
// official wording; do not restate availability differently elsewhere.
export const COVERAGE_COPY = {
  same_day: { frLabel: "Fournisseur disponible", label: "Provider Available", note: "A verified contractor currently serves this territory, subject to scheduling and job acceptance.", tone: "text-market-accent", fr: "Territoire d'un fournisseur vérifié. L'entrepreneur doit encore accepter votre travail, le prix et la plage horaire." },
  matching: { frLabel: "Recherche d'un entrepreneur en cours", label: "Contractor Matching", note: "Customers can submit requests, but fulfillment is not yet confirmed. No appointment is confirmed.", tone: "text-brand-amber", fr: "Recherche d'un entrepreneur en cours pour une demande ouverte. Aucun rendez-vous n'est confirmé." },
  recruiting: { frLabel: "Recrutement de fournisseurs", label: "Recruiting", note: "The platform is seeking qualified providers and cannot currently promise fulfillment. Requests remain open.", tone: "text-market-muted", fr: "Aucun fournisseur vérifié n'est inscrit pour cette municipalité. Les demandes restent ouvertes; la collecte n'est pas confirmée." },
  currently_unavailable: { frLabel: "Service actuellement indisponible", label: "Unavailable", note: "Service cannot currently be arranged through the platform. You can still submit a request for review.", tone: "text-market-muted", fr: "Aucune disponibilité n'est confirmée ici. Vous pouvez quand même soumettre une demande." },
};

// The single consistent availability message used across the website.
export const NATIONAL_COVERAGE_MESSAGE =
  "Request junk removal anywhere in Canada. Same-day service is subject to confirmed local provider availability.";