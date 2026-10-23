import { Image } from "@/components/ui/image";

// media.base44.com URL so the platform image pipeline resizes the image and
// serves AVIF/WebP — the original transparent PNG is 2.5 MB and must never
// reach a phone at full size. `eager` is for the above-the-fold launcher.
const MASCOT_FULL_URL = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/1dbc3f362_rex-full-transparent.png";

export default function AiMascotFull({ height, waveOnce = false, className = "", eager = false }) {
  return (
    <span
      className={`relative inline-block shrink-0 mascot-float ${className}`}
      style={height ? { height } : undefined}
    >
      <Image
        src={MASCOT_FULL_URL}
        alt="Rex, the Same Day Recycling human mascot"
        originWidth={843}
        originHeight={1512}
        targetWidth={112}
        className={`${waveOnce ? "mascot-wave-once" : "mascot-wave"} h-full w-auto`}
        fittingType="fit"
        loading={eager ? "eager" : undefined}
        fetchpriority={eager ? "low" : undefined}
      />
    </span>
  );
}