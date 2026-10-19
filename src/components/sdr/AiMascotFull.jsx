import { Image } from "@/components/ui/image";

const MASCOT_FULL_URL = "/rex-mascot.png";

export default function AiMascotFull({ height, waveOnce = false, className = "" }) {
  return (
    <span
      className={`relative inline-block shrink-0 mascot-float ${className}`}
      style={height ? { height } : undefined}
    >
      <Image
        src={MASCOT_FULL_URL}
        alt="Rex, the Same Day Recycling human mascot"
        originWidth={1024}
        originHeight={1024}
        className={`${waveOnce ? "mascot-wave-once" : "mascot-wave"} h-full w-auto drop-shadow-[0_0_14px_rgba(29,158,86,0.55)]`}
        fittingType="fit"
      />
    </span>
  );
}