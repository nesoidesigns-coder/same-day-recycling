import { useEffect, useState } from "react";
import { Facebook } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FacebookNewspaper from "./FacebookNewspaper";

const PAGE_URL = "https://www.facebook.com/p/SAME-DAY-Recycling-Vancouver-BC-61595167654524/";
const PLUGIN_SRC = "https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fp%2FSAME-DAY-Recycling-Vancouver-BC-61595167654524%2F&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true";

export default function FacebookFeed() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      base44.functions
        .invoke("facebookHighlights", {})
        .then((res) => {
          if (active && res?.data?.posts?.length) setPosts(res.data.posts);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        {posts ? (
          <FacebookNewspaper posts={posts} />
        ) : (
          <div className="w-full max-w-md mx-auto overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
            <iframe
              src={PLUGIN_SRC}
              title="Same Day Recycling Facebook feed"
              width="500"
              height="600"
              style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              loading="lazy"
              className="block w-full max-w-full"
            ></iframe>
          </div>
        )}

      </div>
    </section>
  );
}