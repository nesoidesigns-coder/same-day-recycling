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
      const src = params.get("utm_source") || params.get("src") || "";
      base44.functions
        .invoke("trackVisit", { path: window.location.pathname, referrer: document.referrer, sid: getSessionId(), country: visitorCountry(), src })
        .catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  return null;
}