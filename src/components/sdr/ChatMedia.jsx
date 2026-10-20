const MEDIA_RE = /(https?:\/\/[^\s()\[\]"']+\.(?:mp3|mp4|m4a|wav|webm)(?:\?[^\s()\[\]"']*)?)/gi;
const AUDIO_RE = /\.(?:mp3|m4a|wav)(?:\?|$)/i;

export default function ChatMedia({ content }) {
  const urls = [...new Set(String(content || "").match(MEDIA_RE) || [])];
  if (!urls.length) return null;
  return (
    <div className="mb-2 space-y-2 not-prose">
      {urls.map((u) =>
        AUDIO_RE.test(u) ? (
          <audio key={u} controls src={u} className="w-full max-w-[240px] h-10" />
        ) : (
          <video key={u} controls src={u} className="w-full max-w-[240px] rounded-xl border border-slate-200" />
        )
      )}
    </div>
  );
}