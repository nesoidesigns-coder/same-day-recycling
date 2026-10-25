import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Loader2, Link2, AlertTriangle, Compass, BookOpen, GitCompareArrows, ClipboardList, Truck, Gift } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RexPriceCompare from "@/components/home/RexPriceCompare";

// Rex Discover: anonymous consumer research panel for the homepage. One
// conversational field, four outcomes (learn / compare / plan / request),
// grounded answers, free alternatives - and no booking pressure.

const PLACEHOLDER = "What do you need help figuring out today?";
const SUGGESTIONS = [
  "How do I get rid of an old couch and a mattress?",
  "Compare junk removal prices",
  "Plan a cleanout before moving out",
  "Where can I donate a working fridge?",
];

const OUTCOME_BADGE = {
  learn: { icon: BookOpen, text: "Learn more" },
  compare: { icon: GitCompareArrows, text: "Comparing options" },
  plan: { icon: ClipboardList, text: "Planning" },
  request: { icon: Truck, text: "Ready to request service" },
};

const CAD = (n) => (typeof n === "number" ? "$" + Math.round(n).toLocaleString("en-CA") : null);

export default function RexDiscover() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAction = (action, msg) => {
    if (!action) return;
    if (action.type === "plan") { window.location.href = "/move-assist"; return; }
    if (action.type === "request") { window.location.href = "/request-service"; return; }
    // learn / compare stay in the research conversation
    setInput(action.type === "compare"
      ? `Compare ${msg?.matched_location ? "junk removal prices in " + msg.matched_location : "junk removal prices"}`
      : `Tell me more about ${action.label || "this"}`);
  };

  const send = async (textIn) => {
    const text = (textIn ?? input).trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", loading: true }]);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("rexDiscover", {
        messages: next.filter((m) => m.content).slice(-8).map((m) => ({ role: m.role, content: m.content })),
        location,
      });
      const d = res.data;
      base44.analytics.track("rex_discover_research", { outcome: d.outcome || "learn" });
      setMessages([...next, {
        role: "assistant",
        reply: d.reply, outcome: d.outcome, actions: d.actions || [],
        freeAlternatives: d.free_alternatives || [], uncertainty: d.uncertainty,
        sources: d.sources || [], competitorContext: d.competitor_context || [],
        ownPricing: d.own_pricing, matchedLocation: d.matched_location,
      }]);
    } catch (err) {
      setError(err?.message || "Rex is unavailable right now. Please try again.");
      setMessages(next);
    }
    setLoading(false);
  };

  return (
    <section id="rex-discover" className="bg-white py-14 md:py-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f7f5] px-4 py-1.5 text-xs font-bold text-[#187B65] mb-3">
            <Compass className="w-4 h-4" /> Rex Discover — free research, no account needed
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#102B2A]">Figure it out first, decide later</h2>
          <p className="mt-2 text-slate-600">Meet Rex — the friend who knows removals, recycling and what things really cost. Ask him anything. No sign-up, no sales pitch.</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-2 flex gap-2 shadow-sm"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            aria-label="Ask Rex"
            className="flex-1 rounded-xl border-0 bg-white px-4 py-3.5 text-[#102B2A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#187B65]/30"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} aria-label="Ask Rex"
            className="rounded-xl bg-[#187B65] text-white px-5 hover:bg-[#116553] disabled:opacity-40">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        <label className="mt-3 block text-xs text-slate-500">
          <span className="font-bold">Optional:</span> your city or postal code, for location-aware answers
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Vancouver, BC"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#187B65] focus:outline-none"
          />
        </label>

        <RexPriceCompare />

        {messages.length === 0 && !loading && (
          <div className="mt-5 flex gap-2.5">
            <div className="rex-orb w-10 h-10 shrink-0"><div className="rex-orb__core" /></div>
            <div className="flex-1">
              <div className="rounded-2xl rounded-tl-md bg-[#f4f7f5] px-4 py-3.5 text-sm leading-relaxed text-[#102B2A]">
                Hi, I'm Rex! What do you need picked up? An old couch that won't fit down the stairs, a garage that's gotten away from you, or a move coming up — tell me what's going on and I'll help you figure it out, one honest answer at a time.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:border-[#187B65] hover:text-[#187B65]">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start gap-2.5"}`}>
              {m.role === "assistant" && (
                <div className={`rex-orb w-8 h-8 shrink-0 mt-1 ${m.loading ? "rex-orb--listening" : ""}`}><div className="rex-orb__core" /></div>
              )}
              <div className={`max-w-full md:max-w-[90%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[#102B2A] text-white" : "bg-[#f4f7f5] text-[#102B2A]"}`}>
                {m.loading ? (
                  <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Rex is looking into this for you…</div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      {m.outcome && OUTCOME_BADGE[m.outcome] && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 text-[#187B65] px-2.5 py-0.5 text-[10px] font-bold">
                          {(() => { const I = OUTCOME_BADGE[m.outcome].icon; return <I className="w-3 h-3" />; })()}
                          {OUTCOME_BADGE[m.outcome].text}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{m.reply}</p>

                    {m.competitorContext?.length > 0 && (
                      <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3">
                        <div className="text-[11px] font-bold text-slate-500 mb-2">Publicly advertised prices on file — from each provider's own page</div>
                        <div className="space-y-2">
                          {m.competitorContext.map((c) => (
                            <div key={c.name + c.city} className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                              <span className="font-bold text-[#102B2A]">{c.name}</span>
                              <span className="text-slate-600">{c.price_range || "Not published"}{c.minimum ? ` · min ${c.minimum}` : ""}</span>
                              {c.source_url && <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-700 hover:underline">source</a>}
                            </div>
                          ))}
                        </div>
                        {m.ownPricing && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-baseline justify-between gap-2 text-xs">
                            <span className="font-bold text-[#187B65]">Same Day Recycling (published rates{m.ownPricing.city ? `, ${m.ownPricing.city}` : ""})</span>
                            <span className="text-slate-600">{CAD(m.ownPricing.minimum_pickup) ? `min ${CAD(m.ownPricing.minimum_pickup)}` : ""}{m.ownPricing.full_truck ? ` · full load ${CAD(m.ownPricing.full_truck)}` : ""}</span>
                            <Link to="/pricing" className="text-[10px] text-emerald-700 hover:underline">see rates</Link>
                          </div>
                        )}
                      </div>
                    )}

                    {m.freeAlternatives?.length > 0 && (
                      <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3">
                        <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1"><Gift className="w-3 h-3" /> Free or low-cost options</div>
                        <ul className="space-y-1.5 text-xs text-slate-600">
                          {m.freeAlternatives.map((a) => (
                            <li key={a.label}><span className="font-semibold text-[#102B2A]">{a.label}</span> — {a.detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.actions?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.actions.map((a, j) => (
                          <button
                            key={j}
                            onClick={() => runAction(a, m)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${a.type === "request" ? "border border-[#187B65] text-[#187B65] hover:bg-[#187B65] hover:text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-[#187B65] hover:text-[#187B65]"}`}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {m.uncertainty && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{m.uncertainty}</span>
                      </div>
                    )}

                    {m.sources?.length > 0 && (
                      <div className="mt-3 text-xs">
                        <div className="font-bold text-slate-500 mb-1">Sources</div>
                        <ul className="space-y-1">
                          {m.sources.map((s) => (
                            <li key={s}><a href={s} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline break-all"><Link2 className="w-3 h-3 shrink-0" />{s}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
        <p className="mt-5 text-center text-[11px] text-slate-400">Research is anonymous — nothing you ask is shared with contractors, and there's no account required. Verified facts come from published sources on file; everything else is clearly labelled.</p>
      </div>
    </section>
  );
}