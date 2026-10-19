import { ExternalLink, Facebook } from "lucide-react";
import { Image } from "@/components/ui/image";

function headlineOf(message = "") {
  const first = message.split(/[.!?\n]/)[0].trim();
  return first || "Latest Haul";
}

const PAGE_URL = "https://www.facebook.com/p/SAME-DAY-Recycling-Vancouver-BC-61595167654524/";

export default function FacebookNewspaper({ posts }) {
  const [lead, ...rest] = posts;
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto border-2 border-[#0c3b24] bg-[#f8f5ec] shadow-[6px_6px_0_0_#0c3b24]">
      {/* Masthead */}
      <div className="px-6 pt-6 pb-4 text-center border-b-2 border-[#0c3b24]">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-[#0c3b24] border-b border-[#0c3b24] pb-2">
          <span>Vol. 1 — No. {posts.length}</span>
          <span className="hidden sm:inline">{today}</span>
          <span>Free Edition</span>
        </div>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0c3b24]">
          The Recycling Times
        </h2>
        <p className="mt-1 text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#0c3b24]">
          Same Day Recycling — Vancouver, BC · Real hauls, real cleanouts
        </p>
        <div className="mt-3 flex justify-center">
          <div className="flex gap-1">
            <span className="w-16 border-t-4 border-[#0c3b24]"></span>
            <span className="w-2 border-t-4 border-[#0c3b24]"></span>
            <span className="w-16 border-t-4 border-[#0c3b24]"></span>
          </div>
        </div>
      </div>

      {/* Lead story */}
      <a
        href={`https://www.facebook.com/${lead.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group block px-6 py-6 md:grid md:grid-cols-2 md:gap-6"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#1d9e56] mb-2">
            Top Story
          </p>
          <h3 className="font-serif text-2xl md:text-3xl font-black leading-tight text-[#0c3b24] group-hover:text-[#1d9e56] transition-colors">
            {headlineOf(lead.message)}
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-[#243b2f] text-justify md:columns-2 md:gap-6 whitespace-pre-line line-clamp-8">
            {lead.message}
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#0c3b24] group-hover:text-[#1d9e56] transition-colors">
            Full story on Facebook <ExternalLink className="w-3 h-3" />
          </span>
        </div>
        {lead.image ? (
          <div className="mt-5 md:mt-0">
            <div className="border border-[#0c3b24]">
              <Image src={lead.image} alt={headlineOf(lead.message)} className="h-64 md:h-full w-full" fittingType="fill" />
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0c3b24] text-center">
              Photo: our crew on today's haul
            </p>
          </div>
        ) : null}
      </a>

      {/* Column rule divider */}
      <div className="px-6">
        <div className="border-t-4 border-double border-[#0c3b24]"></div>
      </div>

      {/* Secondary stories in newspaper columns */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 sm:divide-x divide-[#0c3b24]/40">
        {rest.map((post) => (
          <a
            key={post.id}
            href={`https://www.facebook.com/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block px-6 py-5 border-t border-[#0c3b24]/40 sm:border-t-0"
          >
            {post.image && (
              <div className="mb-3 border border-[#0c3b24]">
                <Image src={post.image} alt={headlineOf(post.message)} className="h-32 w-full" fittingType="fill" />
              </div>
            )}
            <h4 className="font-serif text-lg font-black leading-snug text-[#0c3b24] group-hover:text-[#1d9e56] transition-colors">
              {headlineOf(post.message)}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-[#243b2f] text-justify line-clamp-4 whitespace-pre-line">
              {post.message}
            </p>
            <span className="mt-2 inline-block text-[10px] font-black uppercase tracking-widest text-[#1d9e56]">
              Continued on Facebook →
            </span>
          </a>
        ))}
      </div>

      {/* Footer strip */}
      <div className="border-t-2 border-[#0c3b24] bg-[#0c3b24] px-6 py-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1d9e56]">
          Updated automatically from our Facebook page
        </span>
        <a
          href={PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#0c3b24] hover:bg-[#17a04c] transition-colors"
        >
          <Facebook className="w-3.5 h-3.5" /> Follow Us
        </a>
      </div>
    </div>
  );
}