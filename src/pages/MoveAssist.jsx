import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import MoveWizard from "@/components/moveassist/MoveWizard";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

// MoveAssist customer entry: "Moving or downsizing? Let Rex organize your
// cleanout." The wizard creates a MoveAssistProject, then Rex builds the plan.
export default function MoveAssist() {
  const [project, setProject] = useState(null);

  const openRex = () => {
    const summary = project ? `I just created MoveAssist project ${project.reference_code}. My situation: ${project.situation?.replace("_", " ")}, ${project.property_type}, ${project.city}. Explain my plan, the pickup stages, and what you still need from me. Do not confirm availability or pricing — estimates and contractor confirmation come later.` : "I am planning a move and want help organizing unwanted-item removal.";
    window.dispatchEvent(new CustomEvent("rex:open", { detail: { question: summary } }));
  };

  return (
    <div className="min-h-screen bg-market-bg text-market-ink">
      <TopBar />
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
        {!project ? (
          <section>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-market-line bg-market-surface px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-market-accent"><Sparkles className="h-3.5 w-3.5" /> MoveAssist · Powered by Rex</span>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Moving or downsizing? Let Rex organize your cleanout.</h1>
              <p className="mt-3 text-market-muted">Answer a few questions and Rex builds your removal plan: what goes, when it's picked up, and what your contractors need to know. We coordinate independent contractors — your final price and pickup window are always confirmed before anything is booked.</p>
            </div>
            <div className="mx-auto mt-6 max-w-2xl">
              <MoveWizard onComplete={setProject} />
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-2xl">
            <div className="rounded-3xl border border-[#187B65]/40 bg-white/5 p-6 text-center sm:p-8">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#187B65]" />
              <h1 className="mt-3 text-3xl font-bold">Your MoveAssist plan is ready</h1>
              <p className="mt-2 text-sm text-market-muted">Keep this reference code — it opens your project dashboard:</p>
              <div className="mt-3 inline-block rounded-2xl bg-[#102B2A]/70 px-6 py-3 font-mono text-xl font-bold tracking-[0.25em] text-white">{project.reference_code}</div>
            </div>

            {project.recommendation?.arrangement && (
              <div className="mt-4 rounded-3xl border border-market-line bg-market-surface p-5">
                <h2 className="text-lg font-bold">Rex recommends</h2>
                <p className="mt-2 font-bold text-market-accent">{project.recommendation.arrangement === "one_time" ? "One-Time Pickup" : "MoveAssist Project"}</p>
                <p className="mt-1 text-sm text-market-muted">{project.recommendation.reason}</p>
                <p className="mt-2 text-xs text-market-muted">Planning advice based on your answers — not a price and not a confirmed appointment. {project.recommendation.arrangement === "one_time" ? "A single pickup covers your move, so no ongoing plan is needed." : "Several coordinated pickups fit your move best."}</p>
              </div>
            )}

            {(project.rex_timeline || []).length > 0 && (
              <div className="mt-4 rounded-3xl border border-market-line bg-market-surface p-5">
                <h2 className="text-lg font-bold">Your cleanout timeline</h2>
                <ol className="mt-3 space-y-3">
                  {project.rex_timeline.map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-market-accent/20 text-xs font-bold text-market-accent">{i + 1}</span>
                      <span><strong className="block text-sm">{t.when}</strong><span className="text-sm text-market-muted">{t.what}</span></span>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-xs text-market-muted">Rex's planning suggestions — adjust anything with Rex or in your dashboard.</p>
              </div>
            )}

            {(project.missing_info || []).length > 0 && (
              <div className="mt-4 rounded-3xl border border-market-line bg-market-surface p-5">
                <h2 className="text-lg font-bold">Rex still needs</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-market-muted">
                  {project.missing_info.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-3xl border border-market-line bg-market-surface p-5">
              <h2 className="text-lg font-bold">Optional: MoveAssist Membership</h2>
              <p className="mt-1 text-sm text-market-muted">For repeat or multi-property customers. Membership pricing and terms are only published after owner approval — ask Rex about a custom plan if you expect ongoing pickups.</p>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to={`/move-assist/dashboard?ref=${encodeURIComponent(project.reference_code)}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#187B65] px-6 font-bold text-white hover:bg-[#1FA184]"><ClipboardList className="h-4 w-4" /> Open my dashboard <ArrowRight className="h-4 w-4" /></Link>
              <button onClick={openRex} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-6 font-bold hover:border-market-accent"><Sparkles className="h-4 w-4" /> Talk it through with Rex</button>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}