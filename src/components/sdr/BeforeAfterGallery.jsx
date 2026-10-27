import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Camera } from "lucide-react";

// Before/After photos for a service page. Photos live in the gallery with
// photo_type 'before' / 'after' and service set to the page slug; pairs are
// matched by order. Renders nothing when no pairs exist yet.
export default function BeforeAfterGallery({ service }) {
  const [pairs, setPairs] = useState(null);

  useEffect(() => {
    if (!service) return;
    base44.entities.GalleryPhoto.filter({ service }, { sort: "sort_order", limit: 60 })
      .then((res) => {
        const photos = res.items || res || [];
        const before = photos.filter((p) => p.photo_type === "before");
        const after = photos.filter((p) => p.photo_type === "after");
        const paired = before
          .map((b, i) => ({ before: b, after: after[i] }))
          .filter((p) => p.before?.file_url && p.after?.file_url);
        setPairs(paired);
      })
      .catch(() => setPairs([]));
  }, [service]);

  if (!service || pairs === null || pairs.length === 0) return null;

  // Provenance decides the wording. AI-generated imagery is labelled as an
  // illustration; only photos tagged as real completed jobs are described as
  // real pickups.
  const isReal = (p) => p?.provenance === "verified_job";
  const allVerified = pairs.every((p) => isReal(p.before) && isReal(p.after));

  return (
    <section className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-center gap-2 justify-center">
          <Camera className="w-5 h-5 text-[#187B65]" />
          <h2 className="text-3xl font-bold tracking-tight text-[#102B2A] text-center">Before &amp; After</h2>
        </div>
        <p className="text-center text-slate-600 mt-2 text-sm">
          {allVerified
            ? "Real pickups from our crews — see exactly how a job goes."
            : "Illustrative example of a typical pickup — not a specific customer's job."}
        </p>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {pairs.map((p, i) => (
            <div key={p.before.id || i} className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              <div className="grid grid-cols-2">
                <div className="relative">
                  <Image src={p.before.file_url} alt={p.before.title || "Before pickup"} className="w-full aspect-[4/3]" fittingType="fill" />
                  <span className="absolute top-2 left-2 rounded-full bg-[#102B2A]/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">Before</span>
                </div>
                <div className="relative">
                  <Image src={p.after.file_url} alt={p.after.title || "After pickup"} className="w-full aspect-[4/3]" fittingType="fill" />
                  <span className="absolute top-2 left-2 rounded-full bg-[#187B65] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">After</span>
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-[#102B2A] text-sm">{p.after.title || p.before.title}</p>
                {(p.after.caption || p.before.caption) && <p className="text-xs text-slate-500 mt-0.5">{p.after.caption || p.before.caption}</p>}
                {!(isReal(p.before) && isReal(p.after)) && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Illustrative image</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}