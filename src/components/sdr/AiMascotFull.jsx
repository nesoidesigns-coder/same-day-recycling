import { Image } from "@/components/ui/image";

const MASCOT_FULL_URL = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/320d03a5e_generated_image.png";

export default function AiMascotFull({ height = 110, className = "" }) {
  return (
    <span
      className={`relative inline-block shrink-0 mascot-float ${className}`}
      style={{ height }}
    >
      <Image
        src={MASCOT_FULL_URL}
        alt="Same Day Recycling AI mascot waving hello"
        className="mascot-wave h-full w-auto drop-shadow-[0_0_14px_rgba(29,158,86,0.55)]"
        fittingType="fit"
      />
    </span>
  );
}