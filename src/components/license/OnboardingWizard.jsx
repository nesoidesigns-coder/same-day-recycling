import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Check, ImageIcon, ArrowRight, ArrowLeft, Rocket, CheckCircle2 } from "lucide-react";

const PRESET_COLORS = ["#187B65", "#102B2A", "#B45309", "#1D4ED8", "#7C3AED", "#DC2626"];
const STEPS = ["Welcome", "Logo", "Colour", "Preferences"];

export default function OnboardingWizard({ license, onComplete }) {
  const [step, setStep] = useState(0);
  const [brandName, setBrandName] = useState(license.brand_name || "");
  const [brandColor, setBrandColor] = useState(license.brand_color || "#187B65");
  const [supportEmail, setSupportEmail] = useState(license.support_email || license.email || "");
  const [supportPhone, setSupportPhone] = useState(license.support_phone || license.phone || "");
  const [logoUri, setLogoUri] = useState(license.logo_uri || "");
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setLogoUri(file_uri);
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      setLogoPreview(signed_url);
    } catch (e) {
      setError(e?.message || "Could not upload the logo.");
    }
    setUploading(false);
  };

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("licenseBranding", {
        brand_name: (brandName.trim() || license.company).slice(0, 60),
        brand_color: brandColor,
        support_email: supportEmail.trim().slice(0, 120),
        support_phone: supportPhone.trim().slice(0, 40),
        ...(logoUri ? { logo_uri: logoUri } : {}),
        onboarding_complete: true,
      });
      await onComplete();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not save your setup.");
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30";

  const card = "rounded-3xl bg-white border border-slate-100 p-8 shadow-sm max-w-xl mx-auto";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-[#187B65]" />
        <span className="text-xs font-bold tracking-[0.18em] uppercase text-slate-400">Getting started</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#102B2A] text-center mb-6">Welcome to your Recycling OS, {license.contact_name.split(" ")[0]}</h1>

      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${i === step ? "bg-[#102B2A] text-[#187B65]" : i < step ? "bg-[#187B65]/15 text-[#187B65]" : "bg-white text-slate-400 border border-slate-100"}`}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>} {label}
            </span>
            {i < STEPS.length - 1 && <span className="w-4 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className={card}>
          <Rocket className="w-8 h-8 text-[#187B65] mb-4" />
          <h2 className="text-xl font-bold text-[#102B2A] mb-2">Your license is active</h2>
          <p className="text-sm text-slate-500 mb-6">Four quick steps to make the dashboard yours: name your business, add a logo, pick your colour, and set how customers reach you. Takes about two minutes.</p>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">What should your business be called?</label>
          <input
            className={inputCls}
            value={brandName}
            maxLength={60}
            placeholder={license.company}
            onChange={(e) => setBrandName(e.target.value)}
          />
          <button
            onClick={() => setStep(1)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 text-sm hover:bg-[#125C4E] transition-colors"
          >
            Start setup <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className={card}>
          <ImageIcon className="w-8 h-8 text-[#187B65] mb-4" />
          <h2 className="text-xl font-bold text-[#102B2A] mb-2">Add your logo</h2>
          <p className="text-sm text-slate-500 mb-6">It appears on your dashboard header. PNG, JPG or WebP. You can skip this and add it later in Settings.</p>
          <div className="flex items-center gap-4 flex-wrap">
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-200 p-1" />
            )}
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-[#187B65] cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {logoUri ? "Replace logo" : "Upload logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
            </label>
            {logoUri && <span className="text-xs font-semibold text-[#187B65]">Logo ready</span>}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => setStep(0)} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-2.5 text-sm hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(2)} disabled={uploading} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60">
              {logoUri ? "Continue" : "Skip for now"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={card}>
          <CheckCircle2 className="w-8 h-8 text-[#187B65] mb-4" />
          <h2 className="text-xl font-bold text-[#102B2A] mb-2">Pick your brand colour</h2>
          <p className="text-sm text-slate-500 mb-6">Used for your dashboard accents and status badges.</p>
          <div className="flex items-center gap-3 flex-wrap mb-6">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrandColor(c)}
                className={`w-10 h-10 rounded-full border-2 transition-transform ${brandColor === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={`Colour ${c}`}
              />
            ))}
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer border border-slate-200"
              aria-label="Custom colour"
            />
            <span className="text-sm font-mono text-slate-500">{brandColor}</span>
          </div>
          <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: brandColor + "22" }}>
            <span className="rounded-full px-3.5 py-1.5 text-xs font-bold" style={{ backgroundColor: brandColor + "33", color: brandColor }}>
              License active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-2.5 text-sm hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-2.5 text-sm hover:bg-[#125C4E] transition-colors">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={card}>
          <h2 className="text-xl font-bold text-[#102B2A] mb-2">Customer contact preferences</h2>
          <p className="text-sm text-slate-500 mb-6">How customers reach your team. You can change these anytime in Settings.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Support email</label>
              <input className={inputCls} value={supportEmail} placeholder="customers@yourbusiness.ca" onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Support phone</label>
              <input className={inputCls} value={supportPhone} placeholder="(604) 555-0123" onChange={(e) => setSupportPhone(e.target.value)} />
            </div>
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => setStep(2)} disabled={saving} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-2.5 text-sm hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 disabled:opacity-60">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={finish} disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving…" : "Finish setup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}