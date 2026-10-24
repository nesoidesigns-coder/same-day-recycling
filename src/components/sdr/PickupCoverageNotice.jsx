import useCoverageStatus from "@/hooks/useCoverageStatus";
import { COVERAGE_COPY } from "@/components/sdr/coveragePresentation";

export default function PickupCoverageNotice({ city, lang = "en", dark = false }) {
  const coverage = useCoverageStatus();
  if (!city?.trim()) return null;
  const status = COVERAGE_COPY[coverage.statusFor(city)];
  const message = status ? (lang === "fr" ? status.fr : `${status.label}. ${status.note}`) : lang === "fr" ? "Statut non confirmé. Aucune disponibilité n'est présumée." : "Coverage status is not confirmed. No availability is assumed.";
  return <p role="status" className={dark ? "mt-3 text-sm leading-relaxed text-market-ink" : "mt-3 text-sm leading-relaxed text-muted-foreground"}>{message}</p>;
}