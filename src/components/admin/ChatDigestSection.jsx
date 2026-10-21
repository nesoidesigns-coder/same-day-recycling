import { useState } from "react";
import { Loader2, MessageCircle, Flame, Inbox } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function ChatDigestSection() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("facebookInsights", { action: "digest" });
      setData(res.data);
    } catch (e) {
      setError(e?.message || "Digest failed");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-slate-100 p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-bold text-[#102B2A] flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#187B65]" /> AI chat digest
        </h2>
        <Button size="sm" onClick={run} disabled={loading} className="bg-[#187B65] text-white hover:bg-[#125C4E]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run digest now"}
        </Button>
      </div>
      <p className="text-sm text-slate-500 mb-3">
        Every day at 9am the AI reviews your Messenger conversations, flags hot leads and unanswered messages, and emails you a digest. Or run it here anytime.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-[#f4f7f5] p-4 text-sm text-slate-700">{data.summary}</div>
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Messages (24h)" value={data.messages_count} />
            <MiniStat label="Bookings captured" value={data.bookings_captured} />
            <MiniStat label="Unanswered" value={data.unanswered_count} />
          </div>
          {data.leads && data.leads.length > 0 && (
            <div>
              <h3 className="font-bold text-[#102B2A] text-sm mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#187B65]" /> Hot leads
              </h3>
              <ul className="flex flex-col gap-1.5">
                {data.leads.map((l, i) => (
                  <li key={i} className="rounded-xl border border-slate-100 p-3 text-sm text-slate-700">{l}</li>
                ))}
              </ul>
            </div>
          )}
          {data.followups_text && (
            <div>
              <h3 className="font-bold text-[#102B2A] text-sm mb-2 flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-[#187B65]" /> Needs follow-up
              </h3>
              <ul className="list-disc pl-5 text-sm text-slate-600 flex flex-col gap-1">
                {data.followups_text.split(" | ").map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f4f7f5] px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-xl font-bold text-[#102B2A]">{Number(value || 0).toLocaleString()}</p>
    </div>
  );
}