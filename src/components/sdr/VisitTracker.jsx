import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getSessionId, visitorCountry } from "@/lib/visitSession";

export default function VisitTracker() {
  useEffect(() => {
    // Deferred off the critical path: the visit is recorded once the page has
    // had 3 seconds to load and interact, so analytics never competes with
    // first paint or booking calls.
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      base44.functions
        .invoke("trackVisit", {
          path: window.location.pathname,
          referrer: document.referrer,
          sid: getSessionId(),
          country: visitorCountry(),
          src: params.get("src") || "",
          utm_source: params.get("utm_source") || "",
          utm_medium: params.get("utm_medium") || "",
          utm_campaign: params.get("utm_campaign") || "",
        })
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}