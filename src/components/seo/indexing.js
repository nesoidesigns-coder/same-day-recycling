const PRIVATE_PATHS = /^\/(?:admin(?:\/|$)|company(?:\/|$)|partners(?:\/|$)|partner-register(?:\/|$)|realtor-dashboard(?:\/|$)|software-pay(?:\/|$)|white-label-pay(?:\/|$)|software\/start(?:\/|$)|login(?:\/|$)|register(?:\/|$)|forgot-password(?:\/|$)|reset-password(?:\/|$)|functions(?:\/|$)|api(?:\/|$))/;

export function robotsForPath(pathname, requested) {
  if (PRIVATE_PATHS.test(pathname)) return "noindex, nofollow";
  if (requested?.includes("noindex")) return requested;
  if (window.location.hostname.endsWith(".base44.app")) return "noindex, follow";
  return requested || "index, follow";
}