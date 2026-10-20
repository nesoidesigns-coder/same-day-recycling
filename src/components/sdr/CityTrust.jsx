import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cityCredentialsFor } from "@/lib/cityTrust";
import { ShieldCheck, Leaf, Star, BadgeCheck, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BASE_CREDENTIALS = [
  { icon: ShieldCheck, label: "Upfront pricing on every job, no hidden fees" },
  { icon: Leaf, label: "Recycling & donation first — never straight to landfill" },
  { icon: BadgeCheck, label: "Upfront pricing, approved before we lift a thing" },
];

export default function CityTrust({ city }) {
  const [stats, setStats] = useState(null);
  const [gMeta, setGMeta] = useState(null);
  const [gReviews, setGReviews] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const credentials = cityCredentialsFor(city.slug);
  const { toast } = useToast();

  const loadGoogleReviews = async () => {
    const [metaRes, revRes] = await Promise.all([
      base44.entities.GoogleReviewsMeta.filter({}, { limit: 1 }),
      base44.entities.GoogleReview.filter({}, { sort: "-created_date", limit: 12 }),
    ]);
    setGMeta(metaRes?.items?.[0] || null);
    setGReviews(revRes?.items || []);
  };

  useEffect(() => {
    let active = true;
    loadGoogleReviews().catch(() => {});
    base44.auth.me().then((me) => active && setIsAdmin(me?.role === "admin")).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const syncGoogleReviews = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke("googleReviews", {});
      await loadGoogleReviews();
      toast({ title: "Google reviews synced" });
    } catch (e) {
      toast({ title: "Sync failed", description: e?.message || "Add the GOOGLE_PLACES_API_KEY secret in the dashboard, then try again." });
    } finally {
      setSyncing(false);
    }
  };

  const cityFirst = [
    ...gReviews.filter((r) => r.city === city.name),
    ...gReviews.filter((r) => !r.city),
    ...gReviews.filter((r) => r.city && r.city !== city.name),
  ];
  const shownReviews = cityFirst.slice(0, 3);

  useEffect(() => {
    let active = true;
    base44.entities.Review
      .aggregate({ query: { city: city.name, approved: true }, avg: "rating" })
      .then((res) => {
        if (active) setStats(res?.rows?.[0] || { count: 0 });
      })
      .catch(() => active && setStats({ count: 0 }));
    return () => {
      active = false;
    };
  }, [city.name]);

  if (!credentials) return null;

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56]/10 px-4 py-1.5 text-sm font-semibold text-[#0c3b24]">
              <ShieldCheck className="w-4 h-4 text-[#1d9e56]" />
              Trusted in {city.name}
            </span>
            {isAdmin && (
              <button
                onClick={syncGoogleReviews}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#1d9e56] px-4 py-2 text-sm font-bold text-[#1d9e56] hover:bg-[#1d9e56] hover:text-[#0c3b24] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing…" : "Sync Google reviews"}
              </button>
            )}
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#0c3b24] tracking-tight">
            Why {city.name} trusts Same Day Recycling
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Local track record, local facilities, and a promise we keep on every load — backed by a Canada-wide partner network.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {credentials.map((c) => (
            <div key={c} className="rounded-2xl border border-slate-100 bg-[#f4f7f5] p-5 flex items-start gap-3">
              <BadgeCheck className="w-5 h-5 text-[#1d9e56] shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-[#0c3b24] leading-snug">{c}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats && stats.count > 0 && (
            <div className="rounded-2xl bg-[#0c3b24] p-5 flex flex-col justify-center">
              <div className="flex gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= Math.round(stats.avg_rating || 5) ? "text-[#1d9e56] fill-[#1d9e56]" : "text-[#1d9e56]/30"}`} />
                ))}
              </div>
              <span className="text-white font-bold">
                {Number(stats.avg_rating || 5).toFixed(1)}/5 · {stats.count} verified {city.name} review{stats.count === 1 ? "" : "s"}
              </span>
            </div>
          )}
          {BASE_CREDENTIALS.map(({ icon: Icon, label }) => (
            <div key={label} className={`rounded-2xl border border-slate-100 bg-[#f4f7f5] p-5 flex items-start gap-3 ${stats && stats.count > 0 ? "" : "lg:col-span-2"}`}>
              <Icon className="w-5 h-5 text-[#1d9e56] shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-[#0c3b24] leading-snug">{label}</span>
            </div>
          ))}
        </div>

        {shownReviews.length > 0 && (
          <div className="mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= Math.round(gMeta?.rating || 5) ? "text-[#1d9e56] fill-[#1d9e56]" : "text-[#1d9e56]/30"}`} />
                    ))}
                  </div>
                  <span className="font-bold text-[#0c3b24]">
                    {gMeta?.rating ? `${Number(gMeta.rating).toFixed(1)}/5` : ""}
                    {gMeta?.user_rating_count ? ` · ${gMeta.user_rating_count} Google reviews` : ""}
                  </span>
                </div>
                <h3 className="mt-2 text-2xl font-bold text-[#0c3b24] tracking-tight">
                  What {city.name} customers say on Google
                </h3>
              </div>
            </div>
            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shownReviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= Math.round(r.rating || 5) ? "text-[#1d9e56] fill-[#1d9e56]" : "text-[#1d9e56]/30"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">"{r.text}"</p>
                  <div className="mt-3 text-xs font-semibold text-[#0c3b24]">
                    {r.author_name} · {r.relative_time}{r.city && r.city !== city.name ? ` · ${r.city}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}