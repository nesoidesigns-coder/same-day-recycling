import { useEffect } from "react";

const BASE = "https://samedayrecycling.ca";

// Per-page SEO: unique title + description, canonical URL and OG mirrors.
// robots: pass "noindex, nofollow" on gated/utility pages that should stay out of search.
export function useSEO({ title, description, path = "", robots } = {}) {
  useEffect(() => {
    if (title) {
      document.title = title;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", title);
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute("content", title);
    }
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", description);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", description);
    }
    const url = `${BASE}${path}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", url);
    if (robots) {
      let r = document.querySelector('meta[name="robots"]');
      if (!r) {
        r = document.createElement("meta");
        r.setAttribute("name", "robots");
        document.head.appendChild(r);
      }
      r.setAttribute("content", robots);
    }
  }, [title, description, path, robots]);
}

export default useSEO;