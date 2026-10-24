import { Link } from 'react-router-dom';
import { Compass, Sparkles, PenLine, MapPin } from 'lucide-react';

// Social-first welcome section for the public community page.
export default function CommunityHero({ isMember, onAskAI, onShareSomething }) {
  const actions = [
    { label: 'Explore Community', icon: Compass, onClick: () => document.getElementById('community-feed')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Ask AI', icon: Sparkles, onClick: onAskAI },
    { label: 'Share Something', icon: PenLine, onClick: onShareSomething },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#187B65] via-[#0f5f4d] to-[#102B2A] text-white" aria-label="Community welcome">
      <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-[#187B65]/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -left-16 bottom-0 w-64 h-64 rounded-full bg-sky-400/15 blur-3xl" aria-hidden="true" />
      <div className="relative px-5 py-10 sm:px-10 sm:py-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-200">Free membership · open to everyone</p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Connect. Discover. Share.<br />Make an Impact.
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-emerald-50/90 leading-relaxed">
          Canada's community for recycling, local services, business opportunities, and smarter living.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {actions.map((a) => (
            <button key={a.label} onClick={a.onClick} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0f5f4d] shadow-sm hover:bg-emerald-50 transition-colors">
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
          <Link to="/services" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors">
            <MapPin className="w-4 h-4" /> Find Local Services
          </Link>
        </div>
        {!isMember && (
          <p className="mt-5 text-xs text-emerald-100/80">
            Browsing as a guest — <a href="/register?returnTo=/community" className="font-bold text-white underline decoration-emerald-300 underline-offset-2">create a free profile</a> to post, reply, vote and share.
          </p>
        )}
      </div>
    </section>
  );
}