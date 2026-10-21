import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Truck, CheckCircle2, ArrowRight } from "lucide-react";

const EQUIPMENT_OPTIONS = [
  "Pickup truck",
  "Pickup + trailer",
  "1-ton + dump trailer",
  "Full dump truck",
  "Bin / container rental",
  "Pallet jack / lifting gear",
];

const CITY_OPTIONS = [
  "Vancouver",
  "Burnaby",
  "Richmond",
  "Surrey",
  "Coquitlam",
  "Kelowna",
  "Kamloops",
  "Edmonton",
  "Calgary",
];

export default function PartnerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ company: "", city: "", equipment: [] });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [alreadyLinked, setAlreadyLinked] = useState(false);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const toggleEquipment = (item) =>
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(item) ? f.equipment.filter((x) => x !== item) : [...f.equipment, item],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.company.trim() || !form.city.trim()) {
      setError("Company name and service city are required.");
      return;
    }
    setStatus("sending");
    try {
      await base44.functions.invoke("partnerPortal", {
        action: "register",
        company: form.company.trim(),
        city: form.city.trim(),
        equipment: form.equipment,
      });
      navigate("/partners");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "";
      if (msg.includes("already exists")) {
        setAlreadyLinked(true);
      } else {
        setError(msg || "Something went wrong. Please call or text (604) 849-1745.");
      }
      setStatus("idle");
    }
  };

  if (alreadyLinked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#051511] px-4">
        <div className="max-w-md text-center rounded-3xl border border-[#1d9e56]/30 bg-[#0c3b24]/50 backdrop-blur-sm p-10">
          <CheckCircle2 className="w-12 h-12 text-[#1d9e56] mx-auto" />
          <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">You're already registered</h1>
          <p className="mt-2 text-sm text-emerald-100/60">A partner account already exists for your email.</p>
          <button onClick={() => navigate("/partners")} className="mt-6 rounded-full bg-[#1d9e56] text-[#032015] font-bold px-6 py-3 text-sm hover:bg-[#25b96b] transition-colors">
            Go to partner dashboard <ArrowRight className="w-4 h-4 inline" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#051511] text-emerald-50">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <span className="inline-flex w-14 h-14 rounded-2xl border border-[#1d9e56]/40 bg-[#0c3b24]/60 items-center justify-center mb-4">
            <Truck className="w-7 h-7 text-[#1d9e56]" />
          </span>
          <h1 className="text-3xl font-bold text-white tracking-tight">Become a partner contractor</h1>
          <p className="mt-2 text-sm text-emerald-100/60">
            Sign up once — your account is linked automatically and you'll see assigned jobs in your dispatch dashboard.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-3xl border border-[#1d9e56]/25 bg-[#0c3b24]/50 backdrop-blur-sm p-6 md:p-8 space-y-5">
          <div>
            <label htmlFor="reg-company" className="block text-sm font-semibold text-white mb-1.5">Company name <span className="text-[#1d9e56]">*</span></label>
            <input id="reg-company" className="input !bg-white" value={form.company} onChange={set("company")} placeholder="Dan's Hauling Ltd." />
          </div>
          <div>
            <label htmlFor="reg-city" className="block text-sm font-semibold text-white mb-1.5">Service city <span className="text-[#1d9e56]">*</span></label>
            <input id="reg-city" className="input !bg-white" value={form.city} onChange={set("city")} placeholder="Vancouver" list="reg-cities" />
            <datalist id="reg-cities">
              {CITY_OPTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <div className="block text-sm font-semibold text-white mb-2">Equipment list</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {EQUIPMENT_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2.5 rounded-xl border border-[#1d9e56]/25 bg-[#051511]/60 px-4 py-3 text-sm text-emerald-100/80 cursor-pointer hover:border-[#1d9e56]/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.equipment.includes(item)}
                    onChange={() => toggleEquipment(item)}
                    className="w-4 h-4 accent-[#1d9e56]"
                  />
                  {item}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-emerald-100/40">Optional — helps dispatch route the right jobs to you.</p>
          </div>

          {error && <p className="text-sm font-medium text-red-400" role="alert">{error}</p>}

          <button type="submit" disabled={status === "sending"} className="w-full rounded-full bg-[#1d9e56] text-[#032015] font-bold px-7 py-4 hover:bg-[#25b96b] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "sending" ? "Creating account…" : "Sign up as a partner"}
          </button>
          <p className="text-xs text-emerald-100/40 text-center">Your login email is linked automatically — nothing to configure.</p>
        </form>
      </div>
    </div>
  );
}