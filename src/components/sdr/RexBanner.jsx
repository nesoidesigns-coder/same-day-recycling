import AiMascotFull from "./AiMascotFull";

export default function RexBanner({ message }) {
  return (
    <div className="bg-[#f4f7f5] border-b border-[#187B65]/20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-end justify-center gap-3">
        <AiMascotFull
          waveOnce
          className="h-[240px] sm:h-[360px] md:h-[500px]"
        />
        <div className="self-start mt-6 rounded-2xl bg-white border border-[#187B65]/30 shadow px-4 py-2.5 text-sm font-semibold text-[#102B2A] max-w-[230px] leading-snug">
          {message}
        </div>
      </div>
    </div>
  );
}