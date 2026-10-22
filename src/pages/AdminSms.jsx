import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Loader2, RefreshCw } from "lucide-react";
import SmsThread from "@/components/admin/sms/SmsThread";
import SmsSettingsCard from "@/components/admin/sms/SmsSettingsCard";

export default function AdminSms() {
  const [messages, setMessages] = useState(null);
  const [active, setActive] = useState("");
  const [settingsTick, setSettingsTick] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const page = await base44.entities.SmsMessage.filter({}, { sort: "-created_date", limit: 300 });
        const items = page?.items || [];
        setMessages(items);
        setActive((cur) => cur || items[0]?.phone || "");
      } catch {
        setMessages([]);
      }
    })();
  }, [settingsTick]);

  const threads = useMemo(() => {
    const byPhone = new Map();
    for (const m of messages || []) {
      if (!byPhone.has(m.phone)) byPhone.set(m.phone, []);
      byPhone.get(m.phone).push(m);
    }
    return [...byPhone.entries()]
      .map(([phone, msgs]) => ({ phone, msgs: msgs.slice().reverse() }))
      .sort((a, b) => String(b.msgs[b.msgs.length - 1]?.created_date || "").localeCompare(String(a.msgs[a.msgs.length - 1]?.created_date || "")));
  }, [messages]);

  const activeThread = threads.find((t) => t.phone === active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#102B2A] tracking-tight">SMS Inbox</h1>
          <p className="text-sm text-slate-500 mt-1">
            Two-way texting with customers and contractors. Customer texts are auto-answered by Rex; contractor texts are logged for you.
          </p>
        </div>
        <button onClick={() => window.location.reload()} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-[#102B2A] transition-colors" aria-label="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-6">
        <SmsSettingsCard onChanged={() => setSettingsTick((t) => t + 1)} />
      </div>

      {messages === null ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-sm">No text conversations yet. Bookings, dispatch offers and replies will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-[280px,1fr] gap-5 items-start">
          <div className="space-y-2 md:max-h-[520px] md:overflow-y-auto md:pr-1">
            {threads.map((t) => {
              const last = t.msgs[t.msgs.length - 1];
              return (
                <button
                  key={t.phone}
                  onClick={() => setActive(t.phone)}
                  className={`w-full text-left rounded-2xl px-4 py-3 border transition-colors ${
                    t.phone === active ? "border-[#187B65] bg-[#f4f7f5]" : "border-slate-200 bg-white hover:border-[#187B65]/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#102B2A] text-sm truncate">{t.phone}</span>
                    {last?.direction === "inbound" && <span className="w-2 h-2 rounded-full bg-[#187B65] shrink-0" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">{last?.body}</div>
                </button>
              );
            })}
          </div>
          {activeThread && (
            <SmsThread key={activeThread.phone} phone={activeThread.phone} messages={activeThread.msgs} onSent={() => window.location.reload()} />
          )}
        </div>
      )}
    </div>
  );
}