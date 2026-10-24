// GA4 event helper for community engagement tracking. Safe no-op before
// Google Analytics (gtag) has loaded. No PII in event parameters.
export function trackGA(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}