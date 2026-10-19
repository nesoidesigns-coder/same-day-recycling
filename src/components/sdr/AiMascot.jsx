import { Image } from "@/components/ui/image";

const MASCOT_URL = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/13c8f66bd_generated_image.png";

export default function AiMascot({ size = 44, className = "" }) {
  return (
    <span
      className={`relative inline-block shrink-0 mascot-float ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute -inset-1 rounded-full bg-[#1d9e56]/50 blur-[6px] mascot-glow"></span>
      <Image
        src={MASCOT_URL}
        alt="Same Day Recycling AI mascot"
        className="relative w-full h-full rounded-full border-2 border-[#1d9e56]"
        fittingType="fill"
      />
      <span className="absolute inset-0 rounded-full mascot-ring pointer-events-none"></span>
    </span>
  );
}