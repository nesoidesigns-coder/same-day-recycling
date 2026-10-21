import { useEffect, useState } from "react";
import { Loader2, Upload, Trash2, ArrowUp, ArrowDown, Images, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

const CATEGORIES = [
  { value: "trucks", label: "Trucks" },
  { value: "crew", label: "Crew" },
  { value: "jobsites", label: "Job Sites" },
];

const panel = "relative overflow-hidden rounded-2xl border border-[#1d9e56]/25 bg-[#0c3b24]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100/50";
const inputCls = "w-full rounded-xl border border-[#1d9e56]/30 bg-[#051511] px-4 py-2.5 text-sm text-emerald-50 placeholder:text-emerald-100/30 focus:border-[#1d9e56] focus:outline-none";

export default function AdminGallery() {
  const [photos, setPhotos] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("trucks");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const load = async () => {
    const res = await base44.entities.GalleryPhoto.filter({}, { sort: "sort_order" });
    setPhotos(res.items || res);
  };

  useEffect(() => {
    load().catch(() => setPhotos([]));
  }, []);

  const upload = async () => {
    setFeedback(null);
    if (!file || !title.trim()) {
      setFeedback({ ok: false, msg: "A photo and a title are required." });
      return;
    }
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const maxSort = photos && photos.length ? Math.max(...photos.map((p) => Number(p.sort_order) || 0)) : 0;
      await base44.entities.GalleryPhoto.create({
        title: title.trim(),
        caption: caption.trim(),
        category,
        file_url,
        sort_order: maxSort + 1,
      });
      setFile(null);
      setTitle("");
      setCaption("");
      setFeedback({ ok: true, msg: "Photo added to the gallery." });
      await load();
    } catch (e) {
      setFeedback({ ok: false, msg: e?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  };

  const move = async (index, dir) => {
    const list = [...photos];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[index];
    const b = list[j];
    await base44.entities.GalleryPhoto.bulkUpdate([
      { id: a.id, sort_order: Number(b.sort_order) || 0 },
      { id: b.id, sort_order: Number(a.sort_order) || 0 },
    ]);
    await load();
  };

  const remove = async (id) => {
    await base44.entities.GalleryPhoto.delete(id);
    await load();
  };

  return (
    <div className="min-h-screen bg-[#051511] text-emerald-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-2xl border border-[#1d9e56]/40 bg-[#0c3b24]/60 flex items-center justify-center">
            <Images className="w-5 h-5 text-[#1d9e56]" />
          </span>
          <div>
            <div className={`${label} mb-1`}>Network media</div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Fleet &amp; Crew Gallery</h1>
            <p className="text-sm text-emerald-100/50">Upload truck and crew photos for the public gallery</p>
          </div>
        </div>

        <div className={`${panel} p-6 mb-10`}>
          <div className="holo-scan absolute top-0 left-0 right-0 h-px bg-[#1d9e56]/50" />
          <div className={label + " mb-4"}>Add a photo</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={`${label} block mb-2`}>Photo file</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-emerald-100/70 file:mr-3 file:rounded-full file:border-0 file:bg-[#1d9e56] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#032015] file:cursor-pointer"
              />
            </div>
            <div>
              <label className={`${label} block mb-2`}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${label} block mb-2`}>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New network truck in Calgary" className={inputCls} />
            </div>
            <div>
              <label className={`${label} block mb-2`}>Caption (optional)</label>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="One line about this shot" className={inputCls} />
            </div>
          </div>
          <button
            onClick={upload}
            disabled={busy}
            className="mt-5 flex items-center gap-2 rounded-full bg-[#1d9e56] text-[#032015] font-bold px-6 py-3 text-sm hover:bg-[#25b96b] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(29,158,86,0.35)]"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {busy ? "Uploading…" : "Upload to gallery"}
          </button>
          {feedback && (
            <p className={`mt-3 text-sm flex items-center gap-2 ${feedback.ok ? "text-[#1d9e56]" : "text-red-300"}`}>
              {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 inline-block">!</span>}
              {feedback.msg}
            </p>
          )}
        </div>

        <div className={label + " mb-4"}>Gallery order</div>
        {photos === null ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className={`${panel} p-10 text-center text-emerald-100/50 text-sm`}>No photos yet — add the first one above.</div>
        ) : (
          <div className="space-y-3">
            {photos.map((p, i) => (
              <div key={p.id} className={`${panel} p-3 flex items-center gap-4`}>
                <div className="w-24 h-16 rounded-xl overflow-hidden border border-[#1d9e56]/20 shrink-0">
                  <Image src={p.file_url} alt={p.title} className="w-full h-full" fittingType="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-sm truncate">{p.title}</p>
                  <p className="text-[11px] text-emerald-100/40">{CATEGORIES.find((c) => c.value === p.category)?.label || p.category}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2 rounded-lg border border-[#1d9e56]/30 text-[#1d9e56] disabled:opacity-30 hover:bg-[#1d9e56]/10 transition-colors" aria-label="Move up">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="p-2 rounded-lg border border-[#1d9e56]/30 text-[#1d9e56] disabled:opacity-30 hover:bg-[#1d9e56]/10 transition-colors" aria-label="Move down">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(p.id)} className="p-2 rounded-lg border border-red-400/30 text-red-300 hover:bg-red-400/10 transition-colors" aria-label="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}