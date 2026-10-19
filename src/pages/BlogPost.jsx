import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.ContentPost.filter({ slug, status: "published" }, { limit: 1 });
        if (items.length) {
          setPost(items[0]);
          document.title = `${items[0].title} | Same Day Recycling`;
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
    })();
  }, [slug]);

  return (
    <div className="bg-white min-h-screen">
      <TopBar />
      <Navbar />

      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
          {post === null && !notFound && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1d9e56] rounded-full animate-spin"></div>
            </div>
          )}

          {notFound && (
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-[#0c3b24]">Article not found</h1>
              <p className="mt-2 text-slate-600">This guide may have been unpublished.</p>
              <Link to="/blog" className="mt-6 inline-block rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#17a04c] transition-colors">
                Back to all guides
              </Link>
            </div>
          )}

          {post && (
            <article>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1d9e56] uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" /> {post.generated_date}
              </div>
              <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-[#0c3b24] leading-tight">{post.title}</h1>
              {post.excerpt && <p className="mt-3 text-lg text-slate-600">{post.excerpt}</p>}

              <div className="mt-8 prose-slate [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#0c3b24] [&_h2]:mt-8 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#0c3b24] [&_h3]:mt-6 [&_p]:text-slate-700 [&_p]:leading-relaxed [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-4 [&_ul]:text-slate-700 [&_li]:my-1.5 [&_strong]:text-[#0c3b24] [&_a]:text-[#1d9e56] [&_a]:font-semibold">
                <ReactMarkdown>{post.body}</ReactMarkdown>
              </div>

              <div className="mt-10 rounded-3xl bg-[#0c3b24] text-white p-8 text-center">
                <h2 className="text-xl md:text-2xl font-bold">Need it hauled instead?</h2>
                <p className="mt-2 text-slate-300 text-sm">Same-day junk removal and recycling across British Columbia.</p>
                <a href="tel:+16048491745" className="mt-5 inline-block rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3 hover:bg-[#17a04c] transition-colors">
                  Call or text (604) 849-1745
                </a>
              </div>

              <Link to="/blog" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#0c3b24] hover:text-[#1d9e56] transition-colors">
                <ArrowLeft className="w-4 h-4" /> All guides
              </Link>
            </article>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}