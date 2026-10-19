import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Facebook, Sparkles, Send, Loader2, MessageCircle, Power, BarChart3 } from "lucide-react";
import ChatDigestSection from "@/components/admin/ChatDigestSection";
import EngagementSection from "@/components/admin/EngagementSection";

export default function AdminFacebook() {
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [settings, setSettings] = useState(null);
  const [topic, setTopic] = useState("");
  const [variations, setVariations] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [log, setLog] = useState([]);
  const [visits, setVisits] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("facebookAiPost", { action: "status" });
      setStatus(res.data);
      setStatusError("");
    } catch (e) {
      setStatusError(e?.message || "Could not reach Facebook. Reconnect the Facebook integration.");
    }
    try {
      await base44.functions.invoke("syncFacebookPage", {});
      const page = await base44.entities.FacebookSettings.filter({}, { limit: 1 });
      setSettings(page.items[0] || null);
    } catch {
      try {
        const page = await base44.entities.FacebookSettings.filter({}, { limit: 1 });
        setSettings(page.items[0] || null);
      } catch {}
    }
    try {
      const logPage = await base44.entities.FacebookMessageLog.filter(
        {},
        { sort: "-created_date", limit: 10 }
      );
      setLog(logPage.items || []);
    } catch {}
    loadVisits();
  };

  const loadVisits = async () => {
    try {
      const res = await base44.functions.invoke("visitStats");
      setVisits(res.data || null);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(loadVisits, 60000);
    return () => clearInterval(t);
  }, []);

  const toggleAutoReply = async () => {
    const newValue = !(settings?.auto_reply_enabled !== false);
    if (settings) {
      await base44.entities.FacebookSettings.update(settings.id, { auto_reply_enabled: newValue });
    } else {
      await base44.entities.FacebookSettings.create({ auto_reply_enabled: newValue });
    }
    setSettings(settings ? { ...settings, auto_reply_enabled: newValue } : { auto_reply_enabled: newValue });
  };

  const toggleAutoPost = async () => {
    const newValue = !(settings?.auto_post_enabled !== false);
    if (settings) {
      await base44.entities.FacebookSettings.update(settings.id, { auto_post_enabled: newValue });
    } else {
      await base44.entities.FacebookSettings.create({ auto_post_enabled: newValue });
    }
    setSettings(settings ? { ...settings, auto_post_enabled: newValue } : { auto_post_enabled: newValue });
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setBusy("draft");
    setNotice("");
    setError("");
    try {
      const res = await base44.functions.invoke("facebookAiPost", { action: "draft", topic });
      const vars = res.data?.variations || [];
      setVariations(vars);
      setDraft(vars[0] || "");
      if (!vars.length) setError("The AI returned nothing. Try a more specific topic.");
    } catch (e) {
      setError(e?.message || "Generation failed");
    }
    setBusy("");
  };

  const publish = async () => {
    if (!draft.trim()) return;
    setBusy("publish");
    setNotice("");
    setError("");
    try {
      await base44.functions.invoke("facebookAiPost", { action: "publish", message: draft });
      setNotice("Published to your Facebook page.");
      setDraft("");
      setVariations([]);
    } catch (e) {
      setError(e?.message || "Publish failed");
    }
    setBusy("");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-2xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Facebook className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight">Facebook AI Hub</h1>
            <p className="text-sm text-slate-500">AI posts, live highlights and Messenger auto-replies</p>
          </div>
        </div>

        {statusError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">{statusError}</div>
        )}

        {status && (
          <div className="mb-6 rounded-2xl border border-slate-100 bg-[#f4f7f5] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[#0c3b24]">{status.page_name}</p>
              <p className="text-sm text-slate-500">
                {status.followers > 0 ? `${Number(status.followers).toLocaleString()} followers` : "Connected"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Messenger auto-reply</span>
                <Button
                  size="sm"
                  onClick={toggleAutoReply}
                  className={settings?.auto_reply_enabled === false ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#1d9e56] text-white hover:bg-[#17a04c]"}
                >
                  <Power className="w-4 h-4 mr-1" />
                  {settings?.auto_reply_enabled === false ? "Off" : "On"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">AI daily auto-post</span>
                <Button
                  size="sm"
                  onClick={toggleAutoPost}
                  className={settings?.auto_post_enabled === false ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#1d9e56] text-white hover:bg-[#17a04c]"}
                >
                  <Power className="w-4 h-4 mr-1" />
                  {settings?.auto_post_enabled === false ? "Off" : "On"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 p-5 mb-6">
          <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#1d9e56]" /> AI post generator
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              className="input flex-1"
              placeholder="Post topic, e.g. we cleared a 3-bedroom estate in Burnaby today"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Button onClick={generate} disabled={busy === "draft" || !topic.trim()} className="bg-[#0c3b24] text-white hover:bg-[#0a3020]">
              {busy === "draft" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Draft with AI"}
            </Button>
          </div>
          {variations.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {variations.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setDraft(v)}
                  className="text-xs rounded-full border border-[#1d9e56]/40 text-[#0c3b24] px-3 py-1.5 hover:bg-[#1d9e56]/10 transition-colors"
                >
                  Variation {i + 1}
                </button>
              ))}
            </div>
          )}
          <textarea
            className="input min-h-[140px] resize-y"
            placeholder="Your post text appears here. Edit freely before publishing."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={publish} disabled={busy === "publish" || !draft.trim()} className="bg-[#1d9e56] text-white hover:bg-[#17a04c]">
              {busy === "publish" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />} Publish to page
            </Button>
            {notice && <span className="text-sm text-[#1d9e56] font-medium">{notice}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-5 mb-6">
          <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[#1d9e56]" /> Traffic insights (last 7 days)
          </h2>
          {visits?.visits_7d ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Total visits" value={visits.visits_7d.total} />
              <Stat label="From Facebook" value={visits.visits_7d.facebook} />
              <Stat label="From search" value={visits.visits_7d.search} />
              <Stat label="Direct / typed" value={visits.visits_7d.direct} />
              <Stat label="Other referrals" value={visits.visits_7d.other} />
              <Stat label="Bookings" value={visits.bookings_7d} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Loading traffic data…</p>
          )}
          {visits?.visits_24h && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-2">Live · last 24 hours</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Stat label="Site clicks" value={visits.visits_24h.total} />
                <Stat label="From Facebook" value={visits.visits_24h.facebook} />
                <Stat label="From search" value={visits.visits_24h.search} />
                <Stat label="Direct / typed" value={visits.visits_24h.direct} />
              </div>
              {(visits.top_paths_24h || []).length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  Top pages: {(visits.top_paths_24h || []).map((r) => `${r.path} (${r.count})`).join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>

        <ChatDigestSection />
        <EngagementSection />

        <div className="rounded-2xl border border-slate-100 p-5">
          <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-[#1d9e56]" /> Recent AI Messenger replies
          </h2>
          {log.length === 0 ? (
            <p className="text-sm text-slate-500">
              No auto-replies yet. The AI checks Messenger every 30 minutes and answers new customer messages.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {log.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-[#f4f7f5] p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#0c3b24]">{entry.sender_name}</p>
                    {entry.lead_captured && (
                      <span className="rounded-full bg-[#1d9e56]/15 px-2 py-0.5 text-[11px] font-bold text-[#0c3b24]">Booking captured</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{entry.message_text}</p>
                  {entry.reply_text ? (
                    <p className="text-sm text-slate-700 mt-2 pl-3 border-l-2 border-[#1d9e56]">{entry.reply_text}</p>
                  ) : (
                    <p className="text-xs text-red-600 mt-2">Send failed: {entry.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f4f7f5] px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-xl font-bold text-[#0c3b24]">{Number(value || 0).toLocaleString()}</p>
    </div>
  );
}