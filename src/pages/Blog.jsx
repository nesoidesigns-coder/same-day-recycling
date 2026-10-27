import { useEffect, useState } from "react";
import { useSEO } from "@/lib/seo";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import FacebookFeed from "@/components/sdr/FacebookFeed";

export default function Blog() {
  useSEO({
    title: "Recycling & Junk Removal Guides | Same Day Recycling",
    description: "Practical Canadian guides on recycling, junk removal, cleanouts and eco-friendly disposal from the Same Day Recycling network.",
    path: "/blog",
  });
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.ContentPost.filter({ status: "published" }, { sort: "-created_date", limit: 50 });
        setPosts(items);
      } catch {
        setPosts([]);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--ri-ivory))] text-lm-ink">
      <Navbar />

      <section className="mx-auto max-w-[1280px] px-4 pt-6">
        <span className="section-eyebrow">Guides</span>
        <h1 className="mt-1.5 font-heading text-[26px] font-extrabold tracking-tight text-lm-ink">
          Recycling &amp; junk removal guides
        </h1>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-snug text-lm-muted">
          Practical, current advice for Canadian homeowners, realtors, property managers and contractors — researched and written by our team.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-5">
        {posts === null && (
          <div className="flex items-center justify-center py-16" role="status" aria-label="Loading guides">
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-lm-line border-t-[hsl(var(--lm-teal))]" />
          </div>
        )}

        {posts !== null && posts.length === 0 && (
          <div className="rounded-2xl border border-lm-line bg-white p-10 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[hsl(var(--ri-emerald))]" />
            <h2 className="mt-3 font-heading text-[15px] font-bold text-lm-ink">Fresh guides are on the way</h2>
            <p className="mt-1 text-[12px] text-lm-muted">New articles are published regularly. Check back soon.</p>
          </div>
        )}

        {posts !== null && posts.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-lm-line bg-white p-4 transition-colors hover:border-[hsl(var(--lm-teal))]"
              >
                <span className="flex items-center gap-1.5 font-plex text-[9.5px] font-bold uppercase tracking-[0.16em] text-lm-muted">
                  <CalendarDays className="h-3 w-3 text-[hsl(var(--ri-emerald))]" /> {p.generated_date}
                </span>
                <h2 className="mt-1.5 font-heading text-[14px] font-bold leading-snug text-lm-ink transition-colors group-hover:text-[hsl(var(--lm-teal))]">
                  {p.title}
                </h2>
                {p.excerpt && <p className="mt-1.5 flex-1 text-[11.5px] leading-snug text-lm-muted">{p.excerpt}</p>}
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[hsl(var(--lm-teal))]">
                  Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1280px] px-4 pb-8">
        <FacebookFeed />
      </section>

      <Footer />
    </div>
  );
}