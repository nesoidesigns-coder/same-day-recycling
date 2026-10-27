import { useState } from "react";
import { Loader2, BrainCircuit } from "lucide-react";
import { useAdaptive } from "@/components/admin/adaptive/adaptiveData";
import SystemOverviewTab from "@/components/admin/adaptive/SystemOverviewTab";
import FindingsTab from "@/components/admin/adaptive/FindingsTab";
import ImprovementQueueTab from "@/components/admin/adaptive/ImprovementQueueTab";
import EvolutionTimelineTab from "@/components/admin/adaptive/EvolutionTimelineTab";
import ExperimentsTab from "@/components/admin/adaptive/ExperimentsTab";

const TABS = [
  { key: "overview", label: "System Overview" },
  { key: "findings", label: "Intelligence Findings" },
  { key: "queue", label: "Improvement Queue" },
  { key: "timeline", label: "Evolution Timeline" },
  { key: "experiments", label: "Experiment Results" },
];

// Adaptive OS — one control surface over the audit records the platform already
// keeps. It observes and proposes; approvals are recorded here, implementation
// stays manual and every change keeps its trail.
export default function AdminAdaptiveOs() {
  const [tab, setTab] = useState("overview");
  const { data, error, reload } = useAdaptive();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-li-slate">
          <BrainCircuit className="h-4 w-4 text-li-infra" /> Adaptive OS
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-li-carbon">Adaptive Control Centre</h1>
        <p className="mt-1 max-w-3xl text-sm text-li-slate">
          Observe → diagnose → recommend → approve → implement → verify → learn. Everything below is read from records the platform actually holds; nothing is simulated.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-li-steel pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${tab === t.key ? "bg-li-forest text-white" : "text-li-carbon hover:bg-li-pale"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      {!data && !error ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-li-infra" /></div>
      ) : data ? (
        <>
          {tab === "overview" && <SystemOverviewTab data={data} onOpenTab={setTab} />}
          {tab === "findings" && <FindingsTab data={data} />}
          {tab === "queue" && <ImprovementQueueTab data={data} reload={reload} />}
          {tab === "timeline" && <EvolutionTimelineTab data={data} />}
          {tab === "experiments" && <ExperimentsTab data={data} />}
        </>
      ) : null}
    </div>
  );
}