import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Loader2, Link2, AlertTriangle, Sparkles, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { CATEGORY_LABELS } from "@/lib/recyclingTaxonomy";

const GREETING = "Hi! I'm the Same Day Recycling Assistant. Tell me what you need to recycle and where you are (city, province, or postal code), and I'll find the right rules and local options. I cite sources and tell you when I'm not sure.";

export default function RecyclingAssistant() {
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING, sources: [], uncertainty: "", providers: [] }]);
  const [input, setInput] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", loading: true }]);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("recyclingAssistant", {
        messages: next.filter((m) => m.content).slice(-8).map((m) => ({ role: m.role, content: m.content })),
        location,
      });
      setMessages([
        ...next,
        {
          role: "assistant",
          content: res.data.reply,
          sources: res.data.sources || [],
          uncertainty: res.data.uncertainty || "",
          providers: res.data.local_providers || [],
          dirQuery: text,
          dirLoc: location || res.data.matched_location || "",
        },
      ]);
    } catch (err) {
      setError(err?.message || "The assistant is unavailable right now. Please try again.");
      setMessages(next);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-11 h-11 rounded-2xl bg-[#102B2A] text-[#187B65] flex items-center justify-center"><Sparkles className="w-5 h-5" /></span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recycling Assistant</h1>
            <p className="text-sm text-slate-500">Local rules, cited sources, honest uncertainty</p>
          </div>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5" />Your location (improves answers)</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, province, or postal code" className="input !py-2.5" />
        </label>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 space-y-4 max-h-[55vh] overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-[#102B2A] text-white" : "bg-[#f4f7f5] text-[#102B2A]"}`}>
                  {m.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.uncertainty && (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{m.uncertainty}</span>
                        </div>
                      )}
                      {m.sources?.length > 0 && (
                        <div className="mt-3 text-xs">
                          <div className="font-bold text-slate-500 mb-1">Sources</div>
                          <ul className="space-y-1">
                            {m.sources.map((s) => (
                              <li key={s}>
                                <a href={s} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline break-all"><Link2 className="w-3 h-3 shrink-0" />{s}</a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {m.providers?.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[11px] font-bold text-slate-500 mb-1.5">From our nationwide directory</div>
                          <div className="grid gap-2">
                            {m.providers.map((p) => (
                              <div key={p.id} className="rounded-xl bg-white border border-emerald-100 px-3 py-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <Link to={`/provider/${p.id}`} className="text-xs font-bold text-slate-800 hover:text-emerald-600 leading-snug">{p.name}</Link>
                                  {p.verification === "verified" && (
                                    <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold">Verified</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{[p.city, p.province].filter(Boolean).join(", ") || "Canada"} · {p.service_type === "collection" ? "Collection" : p.service_type === "both" ? "Drop-off & collection" : "Drop-off"}</div>
                                {p.accepted_categories?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {p.accepted_categories.slice(0, 4).map((k) => (
                                      <span key={k} className="rounded-full bg-[#f4f7f5] text-[#102B2A] px-2 py-0.5 text-[9px] font-bold">{CATEGORY_LABELS[k] || k}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-[10px] font-bold">
                                  <Link to={`/provider/${p.id}`} className="text-emerald-600 hover:underline">View details</Link>
                                  {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-600">Website</a>}
                                  {p.phone && <a href={`tel:${p.phone}`} className="text-slate-500 hover:text-emerald-600">{p.phone}</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                          <Link
                            to={`/recycling?q=${encodeURIComponent(m.dirQuery || "")}&loc=${encodeURIComponent(m.dirLoc || "")}`}
                            className="inline-block mt-2 text-[10px] font-bold text-emerald-700 hover:underline"
                          >
                            Search the full recycling directory →
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="border-t border-slate-100 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. How do I recycle a mattress in Halifax?"
              className="input !py-2.5"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message" className="rounded-xl bg-emerald-500 text-white px-4 hover:bg-emerald-600 disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {error && <p className="text-xs text-red-600 font-semibold mt-3">{error}</p>}
        <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
          The assistant suggests material categories but can't confirm composition from photos alone. Recycling rules vary by municipality — always confirm with your municipality or the facility before disposal.
        </p>
      </div>
      <Footer />
    </div>
  );
}