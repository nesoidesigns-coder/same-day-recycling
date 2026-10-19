import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Image } from "@/components/ui/image";

function headlineOf(message = "") {
  const first = message.split(/[.!?\n]/)[0].trim();
  return (first || "Latest Haul").toUpperCase().slice(0, 60);
}

export default function FacebookLeaflet({ post, tilt = 0 }) {
  const message = post.message || "";
  const headline = headlineOf(message);

  return (
    <a
      href={`https://www.facebook.com/${post.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-lg border-2 border-[#0c3b24] bg-[#f8f5ec] shadow-[4px_4px_0_0_#0c3b24] transition-transform hover:shadow-[6px_6px_0_0_#1d9e56]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      {/* Masthead band */}
      <div className="flex items-center justify-between bg-[#1d9e56] px-4 py-2">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0c3b24]">
          Same Day Recycling
        </span>
        <span className="rounded-full border-2 border-[#0c3b24] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#0c3b24]">
          Free Est.
        </span>
      </div>

      {/* Big leaflet headline */}
      <p className="px-4 pt-4 text-xl font-black uppercase leading-tight tracking-tight text-[#0c3b24] group-hover:text-[#1d9e56] transition-colors">
        {headline}
      </p>

      {/* Photo */}
      {post.image && (
        <div className="mt-3 border-y-2 border-[#0c3b24]">
          <Image
            src={post.image}
            alt={message.slice(0, 80)}
            className="h-48 w-full"
            fittingType="fill"
          />
        </div>
      )}

      {/* Body */}
      <p className="flex-1 px-4 py-3 text-sm leading-relaxed text-[#243b2f] line-clamp-4 whitespace-pre-line">
        {message}
      </p>

      {/* Perforated tear-off footer */}
      <div className="border-t-2 border-dashed border-[#0c3b24] px-4 py-3 flex items-center justify-between bg-[#f8f5ec]">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0c3b24]">
          {formatDistanceToNow(new Date(post.created_time), { addSuffix: true })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0c3b24] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#f8f5ec] group-hover:bg-[#1d9e56] group-hover:text-[#0c3b24] transition-colors">
          Read Post <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </a>
  );
}