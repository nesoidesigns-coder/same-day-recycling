export default function PickupHeroHeading({ lang, onLanguage, step, copy }) {
  const stages = lang === "fr" ? ["Lieu", "Articles", "Estimation"] : ["Location", "Items", "Estimate"];
  return (
    <header>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#187B65]">{copy.tag}</p>
        <div className="flex shrink-0 rounded-full border border-slate-200 bg-white p-0.5" role="group" aria-label={lang === "fr" ? "Langue de réservation et de la carte" : "Booking and map language"}>
          {["en", "fr"].map((language) => <button key={language} type="button" onClick={() => onLanguage(language)} aria-pressed={lang === language} aria-label={language === "fr" ? "Français" : "English"} className={`min-h-11 min-w-11 rounded-full px-3 text-xs font-bold uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102B2A] ${lang === language ? "bg-[#187B65] text-white" : "text-[#102B2A] hover:bg-slate-100"}`}>{language}</button>)}
        </div>
      </div>
      <h2 className="mt-3 font-heading text-[1.875rem] font-bold leading-tight tracking-tight text-[#102B2A] sm:text-4xl lg:text-[2.5rem]">{step === 3 ? copy.done : copy.title}</h2>
      {step !== 3 && <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">{copy.sub}</p>}
      <ol className="mt-4 grid grid-cols-3 gap-2" aria-label={lang === "fr" ? "Étapes de la demande" : "Request steps"}>
        {stages.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className="text-xs font-medium text-[#102B2A]"><span className={`mb-2 block h-1 rounded-full ${step >= index ? "bg-[#187B65]" : "bg-slate-200"}`} /><span className="text-slate-500">{index + 1}. </span>{label}</li>)}
      </ol>
      <aside className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5" aria-label={lang === "fr" ? "Conseil de Rex" : "Rex guidance"}>
        <span className="mt-0.5 text-xs font-bold text-[#187B65]">Rex</span>
        <p className="text-xs leading-relaxed text-[#102B2A]">{copy.rexCues[Math.min(step, copy.rexCues.length - 1)]}</p>
      </aside>
    </header>
  );
}