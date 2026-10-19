import { Facebook } from "lucide-react";

const PAGE_URL = "https://www.facebook.com/profile.php?id=61595167654524";
const PLUGIN_SRC = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(PAGE_URL)}&tabs=timeline&width=500&height=700&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&locale=en_CA`;

export default function FacebookFeed() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56]/10 px-4 py-1.5 text-sm font-semibold text-[#0c3b24]">
            <Facebook className="w-4 h-4 text-[#1d9e56]" />
            Latest work
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#0c3b24] tracking-tight">
            Follow our latest work
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Real cleanouts, hauls and rescues — straight from our Facebook feed, updated automatically.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
            <iframe
              src={PLUGIN_SRC}
              title="Same Day Recycling Facebook feed"
              width="500"
              height="700"
              style={{ border: "none", width: "100%" }}
              scrolling="no"
              allow="encrypted-media"
              loading="lazy"
              className="block w-full max-w-full"
            ></iframe>
          </div>
        </div>
        <div className="text-center mt-6">
          <a
            href={PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#0c3b24] text-white font-bold px-6 py-3 text-sm hover:bg-[#0a3020] transition-colors"
          >
            <Facebook className="w-4 h-4" />
            Follow us on Facebook
          </a>
        </div>
      </div>
    </section>
  );
}