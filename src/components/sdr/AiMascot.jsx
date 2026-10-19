import { Image } from "@/components/ui/image";

const MASCOT_URL = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/b82fae979_generated_84e766bb.png";

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
          originWidth={1024}
          originHeight={1024}
          alt="Rex, the Same Day Recycling 3D vinyl toy mascot"
          className="w-full h-full"
          style={{ transform: "scale(2.8) translateY(26%)", transformOrigin: "50% 24%" }}
          fittingType="fill"
        />
      </span>
      <span className="absolute inset-0 rounded-full mascot-ring pointer-events-none"></span>
    </span>
  );
}