import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Sparkles, Bot } from 'lucide-react';

const CATEGORY_LABELS = {
  business_intelligence: 'Business Intelligence',
  recycling_knowledge: 'Recycling Knowledge',
  homeowner_advice: 'Homeowner Advice',
  industry_insights: 'Industry Insights',
};

export default function CommunitySpotlight({ onOpen }) {
  const featured = useQuery({
    queryKey: ['communitySpotlight'],
    queryFn: async () => (await base44.entities.CommunityPost.filter({ ai_generated: true, status: 'published' }, { sort: '-created_date', limit: 8 })).items || [],
  });

  const posts = featured.data || [];
  if (featured.isPending || posts.length === 0) return null;
  const post = posts.find((p) => p.image_url) || posts[0];

  return (
    <button onClick={() => onOpen(post)} className="block w-full text-left rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#187B65]/50 transition-colors">
      {post.image_url && (
        <div className="aspect-[16/10] w-full overflow-hidden">
          <Image src={post.image_url} alt="" className="w-full h-full" fittingType="fill" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65] text-white px-2 py-0.5"><Sparkles className="w-3 h-3" /> Featured</span>
          <span className="text-[#187B65]">{CATEGORY_LABELS[post.category] || 'Community'}</span>
        </div>
        <h3 className="mt-2 text-base font-bold text-[#102B2A] leading-snug">{post.title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-3">{post.body}</p>
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <Bot className="w-3.5 h-3.5 text-[#187B65]" /> Recycling OS Intelligence · AI-generated
        </p>
      </div>
    </button>
  );
}