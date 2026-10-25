import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ClipboardList, Loader2, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import StageCard from "@/components/moveassist/StageCard";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

// Customer MoveAssist dashboard, opened with the project's reference code.
// Shows the plan Rex built and keeps every pickup stage individually tracked.
export default function MoveAssistDashboard() {
  const [params, setParams] = useSearchParams();
  const ref = (params.get("ref") || "").trim();
  const [project, setProject] = useState(null);
  const [codeInput, setCodeInput] = useState(ref);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!ref);

  useEffect(() => {
    if (!ref) return;
    let alive = true;
    setLoading(true);
    base44.functions.invoke("moveAssist", { action: "get", reference_code: ref })
      .then((res) => { if (alive) { if (res.data?.project) setProject(res.data.project); else setError(res.data?.error || "Project not found."); } })
      .catch(() => { if (alive) setError("Project not found. Check your reference code."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ref]);

  const save = async (changes) => {
    const res = await base44.functions.invoke("moveAssist", { action: "update", reference_code: project.reference_code, changes });
    if (res.data?.project) setProject(res.data.project);
  };

  const setStage = (stageId, patch) => {
    const stages = (project.stages || []).map((s) => (s.id === stageId ? { ...s, ...patch } : s));
    setProject({ ...project, stages });
    save({ stages });
  };

  const toggleItem = (index) => {
    const inventory = project.inventory.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item));
    setProject({ ...project, inventory });
    save({ inventory });
  };

  const askRex = () => {
    const summary = `MoveAssist project ${project.reference_code}: ${project.situation?.replace("_", " ")} in ${project.city}, move date ${project.move_date || "flexible"}, ${project.stages?.length || 0} pickup stages. Help me review my plan, answer my questions, and tell me what's still missing. Never book or charge anything without my explicit approval.`;
    window.dispatchEvent(new CustomEvent("rex:open", { detail: { question: summary } }));
  };

  const daysLeft = project?.move_date ? Math.ceil((new Date(project.move_date) - new Date()) / 86400000) : null;

  if (!ref || (!project && !loading)) {
    return (
      <div className="min-h-screen bg-market-bg text-market-ink">
        <TopBar /><Navbar />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-market-accent" />
          <h1 className="mt-4 text-2xl font-bold">Open your MoveAssist project</h1>
          <p className="mt-2 text-sm text-market-muted">Enter the reference code from your MoveAssist plan.</p>
          <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} maxLength={12} className="input mt-4 bg-white/95 text-center font-mono text-lg tracking-[0.3em]" placeholder="XXXXXXXX" />
          <button onClick={() => setParams({ ref: codeInput.trim() })} disabled={codeInput.trim().length < 6} className="mt-3 w-full rounded-full bg-market-accent px-6 py-3 font-bold text-market-bg disabled:opacity-50">Open project</button>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <Link to="/move-assist" className="mt-6 inline-block text-sm text-market-accent underline">Start a new MoveAssist plan</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-market-bg text-market-ink" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-market-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-market-bg text-market-ink">
      <TopBar /><Navbar />
      <main className="mx-auto max-w-screen-lg px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">MoveAssist · {project.name}</h1>
            <p className="mt-1 text-sm text-market-muted">{project.address ? `${project.address}` : project.city}{project.move_date ? ` · Move: ${project.move_date}` : " · Flexible date"}{daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft} days left)` : ""}</p>
            <p className="mt-1 text-xs font-mono text-market-muted">Ref {project.reference_code} · {project.status}</p>
          </div>
          <button onClick={askRex} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-market-accent px-5 text-sm font-bold text-market-bg hover:opacity-90"><Sparkles className="h-4 w-4" /> Ask Rex</button>
        </header>

        {(project.rex_timeline || []).length > 0 && (
          <section className="mt-6 rounded-3xl border border-market-line bg-market-surface p-5">
            <h2 className="text-lg font-bold"><CalendarDays className="mr-2 inline h-5 w-5 text-market-accent" />Cleanout timeline</h2>
            <ol className="mt-3 space-y-3">
              {project.rex_timeline.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-market-accent/20 text-xs font-bold text-market-accent">{i + 1}</span>
                  <span><strong className="block text-sm">{t.when}</strong><span className="text-sm text-market-muted">{t.what}</span></span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-market-muted">Rex's planning suggestions, based on your answers.</p>
          </section>
        )}

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-3 text-lg font-bold">Pickup stages</h2>
            <div className="space-y-3">
              {(project.stages || []).map((stage) => <StageCard key={stage.id} stage={stage} project={project} onChange={setStage} />)}
              {!(project.stages || []).length && <p className="text-sm text-market-muted">Rex hasn't suggested stages yet — ask Rex or add your first pickup below.</p>}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-bold">Item checklist</h2>
            <div className="rounded-3xl border border-market-line bg-market-surface p-4">
              <ul className="space-y-2">
                {(project.inventory || []).map((item, i) => (
                  <li key={i}>
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input type="checkbox" checked={item.checked === true} onChange={() => toggleItem(i)} className="h-4 w-4" />
                      <span className={item.checked ? "text-market-muted line-through" : ""}>{item.quantity} × {item.item}</span>
                    </label>
                  </li>
                ))}
                {!(project.inventory || []).length && <li className="text-sm text-market-muted">No items recorded yet.</li>}
              </ul>
              {(project.photos || []).length > 0 && <p className="mt-3 text-xs text-market-muted">{project.photos.length} photo{(project.photos.length > 1 ? "s" : "")} saved privately with this project.</p>}
            </div>

            {(project.missing_info || []).length > 0 && (
              <div className="mt-4 rounded-3xl border border-market-line bg-market-surface p-4">
                <h3 className="font-bold">Rex still needs</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-market-muted">
                  {project.missing_info.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-3xl border border-market-line bg-market-surface p-4">
              <h3 className="font-bold">Arrangement</h3>
              <p className="mt-1 text-sm font-bold text-market-accent">{project.arrangement === "one_time" ? "One-Time Pickup" : project.arrangement === "membership" ? "MoveAssist Membership" : "MoveAssist Project"}</p>
              <p className="mt-1 text-xs text-market-muted">{project.recommendation?.reason || "Based on your answers."}</p>
              {project.arrangement !== "membership" && <p className="mt-2 text-xs text-market-muted">Optional membership plans exist for repeat customers — pricing is published only with owner approval. Ask Rex.</p>}
            </div>

            <div className="mt-4 rounded-3xl border border-market-line bg-market-surface p-4">
              <h3 className="font-bold">Payments & receipts</h3>
              <p className="mt-1 text-sm text-market-muted"><CheckCircle2 className="mr-1 inline h-4 w-4 text-[#187B65]" />{project.stages?.some((s) => s.status === "completed") ? "Completed pickups show receipts in your request tracking." : "Payments are settled per pickup after the contractor confirms the final price."}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}