import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { robotsForPath } from "@/components/seo/indexing";

export default function SearchIndexing() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const matches = [...document.head.querySelectorAll('meta[name="robots"]')];
    const tag = matches.shift() || document.createElement("meta");
    matches.forEach((duplicate) => duplicate.remove());
    tag.setAttribute("name", "robots");
    tag.setAttribute("content", robotsForPath(pathname));
    if (!tag.parentNode) document.head.appendChild(tag);
  }, [pathname]);
  return null;
}