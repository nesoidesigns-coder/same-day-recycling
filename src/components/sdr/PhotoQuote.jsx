import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2, ArrowRight, ImageIcon } from "lucide-react";
import { CITIES } from "@/lib/cities";
import QuoteLeadCapture from "@/components/sdr/QuoteLeadCapture";

export default function PhotoQuote({ onBook, city: fixedCity }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(fixedCity || "");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setQuote(null);
  };

  const getQuote = async () => {
    if (!photo) return;
    setLoading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: photo });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      const res = await base44.functions.invoke("quoteEstimate", {
        image_urls: [signed_url],
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(city ? { city } : {}),
      });
      setQuote(res.data);
      base44.analytics.track("photo_quote_calculated", { city: city || "" });
    } catch {
      setError("Couldn't read that photo right now — text it to (604) 849-1745 and we'll quote it right away.");
    } finally {
      setLoading(false);
    }
  };

  const itemsText = description.trim() || "Photo estimate";

  return (
    <section id="photo-quote" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Photo quote</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Text a photo, get a firm price</h2>
          <p className="mt-4 text-slate-600">No site visit, no waiting around for an estimator. Snap one photo of your junk and get a firm, no-obligation price in about a minute.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8">
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
              {preview ? (
                <div className="rounded-2xl overflow-hidden border border-slate-100 mb-1">
                  <img src={preview} alt="Your junk pile" className="w-full h-56 object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-[#f4f7f5] px-4 py-10 text-center mb-1">
                  <Camera className="w-9 h-9 text-[#187B65] mx-auto mb-3" />
                  <div className="font-bold text-[#102B2A]">Snap or choose a photo</div>
                  <div className="text-sm text-slate-500 mt-1">One clear shot of the pile is all we need</div>
                </div>
              )}
            </label>
            <label className="block mt-5">
              <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Anything the photo doesn't show? (optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="input resize-none"
                placeholder="e.g. there's also a treadmill behind the couch"
              />
            </label>
            {!fixedCity && (
              <label className="block mt-4">
                <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Your city</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
                  <option value="">Standard rates (any city)</option>
                  {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </label>
            )}
            <button
              onClick={getQuote}
              disabled={!photo || loading}
              className="mt-5 w-full rounded-full bg-[#102B2A] text-white font-bold px-7 py-3.5 hover:bg-[#0a3020] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              {loading ? "Reading your photo…" : "Get my firm price"}
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
          <div className="rounded-3xl bg-[#102B2A] text-white p-8 md:p-10">
            {!quote ? (
              <div className="text-center py-10">
                <ImageIcon className="w-10 h-10 text-[#187B65] mx-auto mb-4" />
                <p className="text-slate-300">Your firm price will appear here.</p>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Your firm price</div>
                <div className="text-4xl md:text-5xl font-bold tracking-tight">{quote.range}</div>
                <div className="mt-3 inline-block rounded-full bg-[#187B65]/20 text-[#187B65] font-semibold px-4 py-1.5 text-sm">{quote.label}</div>
                <p className="mt-5 text-slate-300 text-sm">Firm from your photo, no obligation. Final price confirmed on arrival before we lift a thing.</p>
                <button
                  onClick={() => onBook({ items_text: itemsText, estimate_text: `${quote.range} (${quote.label})`, city })}
                  className="mt-8 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors flex items-center justify-center gap-2"
                >
                  Book this pickup <ArrowRight className="w-5 h-5" />
                </button>
                <QuoteLeadCapture itemsText={itemsText} estimate={`${quote.range} (${quote.label})`} city={city} photo={photo} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}