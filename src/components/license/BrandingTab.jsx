import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, ImageIcon, Check } from "lucide-react";

const PRESET_COLORS = ["#187B65", "#102B2A", "#B45309", "#1D4ED8", "#7C3AED", "#DC2626"];

export default function BrandingTab({ license, onChanged }) {
  const [brandName, setBrandName] = useState(license.brand_name || "");
  const [brandColor, setBrandColor] = useState(license.brand_color || "#187B65");
  const [supportEmail, setSupportEmail] = useState(license.support_email || "");
  const [supportPhone, setSupportPhone] = useState(license.support_phone || "");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const uploadLogo = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setLogoPreview(file_uri);
    } catch (e) {
      setError(e?.message || "Could not upload the logo.");
    }
    setLogoUploading(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("licenseBranding", {
        brand_name: brandName,
        brand_color: brandColor,
        support_email: supportEmail,
        support_phone: supportPhone,
        ...(logoPreview ? { logo_uri: logoPreview } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await onChanged();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not save branding.");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl">
      <h3 className="font-bold text-[#102B2A] mb-1">Business branding</h3>
      <p className="text-sm text-slate-500 mb-5">Your name, colours and logo appear across your company dashboard. Changes are saved to your licensed instance only.</p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Business display name</label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30"
            value={brandName}
            maxLength={60}
            placeholder={license.company}
            onChange={(e) => setBrandName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Brand colour</label>
          <div className="flex items-center gap-3 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrandColor(c)}
                className={`w-9 h-9 rounded-full border-2 transition-transform ${brandColor === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={`Colour ${c}`}
              />
            ))}
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border border-slate-200"
              aria-label="Custom colour"
            />
            <span className="text-sm font-mono text-slate-500">{brandColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Logo</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:border-[#187B65] cursor-pointer">
              {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {logoPreview ? "Replace logo" : "Upload logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
            </label>
            {logoPreview && <span className="text-xs font-semibold text-[#187B65]">Logo ready — saved with your settings</span>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Support email</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30"
              value={supportEmail}
              placeholder="customers@yourbusiness.ca"
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Support phone</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30"
              value={supportPhone}
              placeholder="(604) 555-0123"
              onChange={(e) => setSupportPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}

      <button
        onClick={save}
        disabled={saving || logoUploading}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved" : "Save branding"}
      </button>
    </div>
  );
}