import { useEffect } from "react";
import { robotsForPath } from "@/components/seo/indexing";

export const PRODUCTION_URL = "https://samedayrecycling.ca";

function setMeta(attribute, key, content) {
  const matches = [...document.head.querySelectorAll(`meta[${attribute}="${key}"]`)];
  const element = matches.shift() || document.createElement("meta");
  matches.forEach((duplicate) => duplicate.remove());
  element.setAttribute(attribute, key);
  element.setAttribute("content", content);
  if (!element.parentNode) document.head.appendChild(element);
}

// Every page sets all metadata, so navigation cannot retain a previous page's
// description, canonical URL or noindex directive. Dashboard overrides must be off.
export function useSEO({ title, description = "", path, robots } = {}) {
  useEffect(() => {
    const pathname = (path || window.location.pathname).split(/[?#]/)[0] || "/";
    const url = `${PRODUCTION_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    if (title) {
      document.title = title;
      [...document.head.querySelectorAll("title")].slice(1).forEach((tag) => tag.remove());
      setMeta("property", "og:title", title);
      setMeta("name", "twitter:title", title);
    }
    setMeta("name", "description", description);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "robots", robotsForPath(pathname, robots));
    const links = [...document.head.querySelectorAll('link[rel="canonical"]')];
    const canonical = links.shift() || document.createElement("link");
    links.forEach((duplicate) => duplicate.remove());
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", url);
    if (!canonical.parentNode) document.head.appendChild(canonical);

    const data = document.getElementById("page-seo-jsonld") || document.createElement("script");
    data.id = "page-seo-jsonld";
    data.type = "application/ld+json";
    data.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "WebPage",
      "@id": `${url}#webpage`, url, name: title, description,
      isPartOf: { "@id": `${PRODUCTION_URL}/#website` },
    });
    if (!data.parentNode) document.head.appendChild(data);
    return () => data.remove();
  }, [title, description, path, robots]);
}

export default useSEO;