import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function ServiceDeepContent({ sections }) {
  if (!sections?.length) return null;
  return (
    <>
      {sections.map((s) => (
        <section key={s.heading} className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">{s.heading}</h2>
          <div className="mt-5 max-w-3xl">
            <div className="space-y-4 text-slate-600 leading-relaxed">
              {s.paragraphs.map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
            </div>
            {s.links?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {s.links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-[#187B65] hover:border-[#187B65] transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
            {s.bullets?.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {s.bullets.map((b) => (
                  <li key={b.slice(0, 32)} className="flex items-start gap-2.5 text-slate-600">
                    <Check className="w-5 h-5 text-[#187B65] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {s.tiers?.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-[#f4f7f5] p-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  {s.tiers.map((t) => (
                    <div key={t.label} className="rounded-xl bg-white border border-slate-100 p-4">
                      <div className="text-xs font-bold tracking-[0.14em] uppercase text-slate-400">{t.label}</div>
                      <div className="mt-1.5 text-xl font-bold text-[#102B2A]">{t.price}</div>
                      <div className="mt-1 text-sm text-slate-500">{t.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ))}
    </>
  );
}