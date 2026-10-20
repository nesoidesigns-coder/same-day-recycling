import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Truck, Users, MapPinned, LayoutGrid } from "lucide-react";

const TABS = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "trucks", label: "Trucks", icon: Truck },
  { key: "crew", label: "Crew", icon: Users },
  { key: "jobsites", label: "Job Sites", icon: MapPinned },
];

const CAT_LABEL = { trucks: "Trucks", crew: "Crew", jobsites: "Job Sites" };

export default function PhotoGallery() {
  const [photos, setPhotos] = useState(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    base44.entities.GalleryPhoto.filter({}, { sort: "sort_order" })
      .then((res) => setPhotos(res.items || res))
      .catch(() => setPhotos([]));
  }, []);

  const shown = (photos || []).filter((p) => tab === "all" || p.category === tab);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
              tab === t.key
                ? "bg-[#0c3b24] text-[#1d9e56]"
                : "bg-[#f4f7f5] text-[#0c3b24] hover:bg-[#e6efe9]"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {photos === null ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-12 text-center">
          <Truck className="w-8 h-8 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500 text-sm">No photos in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {shown.map((p) => (
            <figure key={p.id} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 aspect-[4/3]">
              <Image src={p.file_url} alt={p.title} className="w-full h-full" fittingType="fill" />
              <span className="absolute top-3 left-3 rounded-full bg-[#0c3b24]/80 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1d9e56]">
                {CAT_LABEL[p.category] || "Trucks"}
              </span>
              <figcaption className="absolute inset-x-0 bottom-0 p-4 pt-8 bg-gradient-to-t from-[#0c3b24]/95 via-[#0c3b24]/60 to-transparent">
                <p className="font-bold text-white text-sm leading-tight">{p.title}</p>
                {p.caption && <p className="text-xs text-emerald-100/80 mt-0.5 line-clamp-2">{p.caption}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}