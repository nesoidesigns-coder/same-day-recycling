import AiMascotFull from "./AiMascotFull";

export default function RexBanner({ message }) {
  return (
    <div className="bg-[#f4f7f5] border-b border-[#1d9e56]/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-end justify-center gap-2">
        <AiMascotFull
          height={100}
          waveOnce
          className="rounded-2xl border-2 border-[#1d9e56]/40 bg-white p-0.5 shadow-[0_0_20px_rgba(29,158,86,0.3)]"
        />
        <div className="mb-4 rounded-2xl bg-white border border-[#1d9e56]/30 shadow px-4 py-2.5 text-sm font-semibold text-[#0c3b24] max-w-[230px] leading-snug">
          {message}
        </div>
      </div>
    </div>
  );
}