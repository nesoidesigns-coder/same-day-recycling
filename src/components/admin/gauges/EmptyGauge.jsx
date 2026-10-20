import { Wrench } from "lucide-react";

export default function EmptyGauge({ title, reasons }) {
  const list = Array.isArray(reasons) ? reasons : [reasons];
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 flex flex-col">
      <div className="text-sm font-bold text-slate-500 leading-snug mb-3">{title}</div>
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="text-center">
          <Wrench className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <div className="text-xs font-bold text-slate-500">Not yet measured</div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">{list[0]}</p>
        </div>
      </div>
      <ul className="space-y-1 text-[11px] text-slate-400">
        {list.length > 1 && list.map((r) => <li key={r} className="flex gap-1.5"><span className="text-slate-300">·</span>{r}</li>)}
      </ul>
    </div>
  );
}