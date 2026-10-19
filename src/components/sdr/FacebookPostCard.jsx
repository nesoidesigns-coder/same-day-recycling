import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Image } from "@/components/ui/image";

export default function FacebookPostCard({ post }) {
  return (
    <a
      href={`https://www.facebook.com/${post.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:border-[#1d9e56]/40 hover:shadow-md transition-all"
    >
      {post.image && (
        <div className="h-44 w-full overflow-hidden">
          <Image src={post.image} alt={post.message.slice(0, 80)} className="h-44 w-full" fittingType="fill" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-[#1d9e56]">
          {formatDistanceToNow(new Date(post.created_time), { addSuffix: true })}
        </p>
        <p className="mt-2 flex-1 text-sm text-slate-700 line-clamp-4 whitespace-pre-line">{post.message}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#0c3b24] group-hover:text-[#1d9e56] transition-colors">
          View post <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  );
}