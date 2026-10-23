import { Image } from "@/components/ui/image";

// media.base44.com URL — the platform pipeline resizes and serves WebP/AVIF
// (the original avatar PNG is 465 KB full-size).
const MASCOT_URL = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/75031ef67_rex-avatar-transparent.png";

export default function AiMascot({ size = 44, className = "" }) {
  return (
    <span
      className={`relative inline-block shrink-0 mascot-float ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute -inset-1 rounded-full bg-[#187B65]/50 blur-[6px] mascot-glow"></span>
      <span className="relative block w-full h-full overflow-hidden rounded-full border-2 border-[#187B65]">
        <Image
          src={MASCOT_URL}
          originWidth={480}
          originHeight={480}
          alt="Rex, the Same Day Recycling human mascot"
          className="w-full h-full"
          fittingType="fit"
        />
      </span>
      <span className="absolute inset-0 rounded-full mascot-ring pointer-events-none"></span>
    </span>
  );
}