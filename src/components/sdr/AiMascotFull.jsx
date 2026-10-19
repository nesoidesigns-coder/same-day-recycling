import { Image } from "@/components/ui/image";

const MASCOT_FULL_URL = "https://base44.app/api/apps/6ac93990cde830898b8dbc65/files/mp/public/6ac93990cde830898b8dbc65/1dbc3f362_rex-full-transparent.png";

export default function AiMascotFull({ height, waveOnce = false, className = "" }) {
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
        className={`${waveOnce ? "mascot-wave-once" : "mascot-wave"} h-full w-auto`}
        fittingType="fit"
      />
    </span>
  );
}