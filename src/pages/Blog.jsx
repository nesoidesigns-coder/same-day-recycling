import React, { useEffect, useState } from "react";
import { useSEO } from "@/lib/seo";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
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
    <div className="bg-white min-h-screen">
      <TopBar />
      <Navbar />
      <RexBanner message="Fresh recycling tips, straight from the crew." />

      <section className="bg-[#f4f7f5]">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-4">
            <span className="w-8 h-px bg-[#187B65]"></span>Guides
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Recycling &amp; junk removal guides</h1>
          <p className="mt-3 text-slate-600 max-w-xl">
            Practical, current advice for Canadian homeowners, realtors, property managers and contractors — researched and written by our team.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          {posts === null && (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#187B65] rounded-full animate-spin"></div>
            </div>
          )}
          {posts !== null && posts.length === 0 && (
            <div className="rounded-3xl bg-[#f4f7f5] p-10 text-center">
              <BookOpen className="w-10 h-10 text-[#187B65] mx-auto" />
              <h2 className="mt-4 text-xl font-bold text-[#102B2A]">Fresh guides are on the way</h2>
              <p className="mt-2 text-slate-600">New articles are published regularly. Check back soon.</p>
            </div>
          )}
          {posts !== null && posts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-5">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group rounded-3xl bg-[#f4f7f5] p-7 hover:border-[#187B65] hover:shadow-lg border border-transparent transition-all flex flex-col"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" /> {p.generated_date}
                  </span>
                  <h2 className="mt-3 text-lg font-bold text-[#102B2A] group-hover:text-[#187B65] transition-colors">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 text-sm text-slate-600 flex-1">{p.excerpt}</p>}
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#102B2A]">
                    Read more <ArrowRight className="w-4 h-4 text-[#187B65] group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <FacebookFeed />

      <Footer />
    </div>
  );
}