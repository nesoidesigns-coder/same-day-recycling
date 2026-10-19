import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function VisitTracker() {
  useEffect(() => {
    base44.functions
      .invoke("trackVisit", { path: window.location.pathname, referrer: document.referrer })
      .catch(() => {});
  }, []);
  return null;
}