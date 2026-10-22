import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Loads the AI-generated meta for a service page path (stored by serviceMetaGenerate)
// and falls back to the page's own copy until, or unless, stored meta exists.
// Pass the result straight into useSEO — it re-applies when the stored meta arrives.
export function useServiceMeta(path, fallback) {
  const [meta, setMeta] = useState(fallback);
  useEffect(() => {
    let alive = true;
    base44.entities.ServicePageMeta.filter({ path }, { limit: 1 })
      .then((page) => {
        const row = page?.items?.[0];
        if (alive && row?.title && row?.description) {
          setMeta({ title: row.title, description: row.description });
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [path]);
  return meta;
}

export default useServiceMeta;