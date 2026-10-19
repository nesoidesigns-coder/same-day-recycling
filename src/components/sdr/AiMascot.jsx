import { Image } from "@/components/ui/image";

const MASCOT_URL = "/rex-mascot.png";

export default function AiMascot({ size = 44, className = "" }) {
  return (
    <span
      className={`relative inline-block shrink-0 mascot-float ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute -inset-1 rounded-full bg-[#1d9e56]/50 blur-[6px] mascot-glow"></span>
      <span className="relative block w-full h-full overflow-hidden rounded-full border-2 border-[#1d9e56]">
        <Image
          src={MASCOT_URL}
          originWidth={402}
          originHeight={664}
          alt="Rex, the Same Day Recycling human mascot"
          className="w-full h-full"
          style={{ transform: "translateY(26%) scale(2.5)", transformOrigin: "50% 24%" }}
          fittingType="fit"
        />
      </span>
      <span className="absolute inset-0 rounded-full mascot-ring pointer-events-none"></span>
    </span>
  );
}