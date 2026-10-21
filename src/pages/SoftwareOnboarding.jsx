import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Recycle, Loader2, CheckCircle2, Building2, UserCheck, Rocket, ArrowRight, ArrowLeft, Mail, AlertTriangle,
} from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

const PROVINCES = ["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"];
const PLANS = {
  starter: { name: "Starter", setup: 2500, monthly: 199 },
  growth: { name: "Growth", setup: 4500, monthly: 399 },
  network: { name: "Network", setup: 9500, monthly: 799 },
};
const STORE_KEY = "sdr_software_onboarding";
const STEPS = [
  { n: 1, label: "Business", icon: Building2 },
  { n: 2, label: "Account", icon: UserCheck },
  { n: 3, label: "Subscription", icon: Rocket },
];

const money = (n) => "$" + Number(n).toLocaleString("en-CA");

export default function SoftwareOnboarding() {
  const params = new URLSearchParams(window.location.search);
  const saved = (() => {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || null; } catch { return null; }
  })();

  const [step, setStep] = useState(Math.min(3, Math.max(1, Number(params.get("step")) || 1)));
  const [form, setForm] = useState(saved?.form || { company: "", contact_name: "", email: "", phone: "", city: "", province: "ON" });
  const [plan, setPlan] = useState(saved?.plan || (PLANS[params.get("plan")] ? params.get("plan") : "starter"));

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [authState, setAuthState] = useState("checking"); // checking | signed_in | signed_out | other_account
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const persist = () => sessionStorage.setItem(STORE_KEY, JSON.stringify({ form, plan }));

  // Guard: steps 2 and 3 need business details
  useEffect(() => {
    if (step > 1 && !form.company) window.location.replace("/software/start?step=1");
  }, [step]);

  // Step 2: check existing sign-in against the business email
  useEffect(() => {
    if (step !== 2) return;
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!active) return;
        if (me?.email && form.email && me.email.toLowerCase() === form.email.toLowerCase()) setAuthState("signed_in");
        else if (me) setAuthState("other_account");
        else setAuthState("signed_out");
      } catch {
        if (active) setAuthState("signed_out");
      }
    })();
    return () => { active = false; };
  }, [step]);

  const startSignup = async () => {
    setError("");
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      await base44.auth.register({ email: form.email, password: pw });
      setShowOtp(true);
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists")) {
        setError("An account already exists for this email. Sign in with it, then return here to continue.");
      } else {
        setError(err?.message || "Registration failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError("");
    setBusy(true);
    try {
      const result = await base44.auth.verifyOtp({ email: form.email, otpCode: otp });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      persist();
      window.location.href = "/software/start?step=3";
    } catch (err) {
      setError(err?.message || "Invalid verification code.");
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(form.email);
      setError(""); // success — the note below confirms it
    } catch (err) {
      setError(err?.message || "Failed to resend the code.");
    }
  };

  const startSubscription = async () => {
    setError("");
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("paypalCheckout", { action: "create_license", ...form, plan });
      sessionStorage.removeItem(STORE_KEY);
      window.location.href = `/software-pay?pay=${data.pay_token}`;
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  const goStep = (n) => { setError(""); setStep(n); };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="admin-console text-white min-h-[calc(100vh-64px)]">
        <div className="max-w-2xl mx-auto px-4 py-12">

          {/* Stepper */}
          <div className="flex items-center justify-between mb-10">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                      step === s.n
                        ? "bg-[#187B65] text-[#102B2A] border-[#187B65]"
                        : step > s.n
                          ? "bg-[#187B65]/15 text-[#187B65] border-[#187B65]/40"
                          : "text-emerald-100/40 border-[#187B65]/20"
                    }`}
                  >
                    {step > s.n ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= s.n ? "text-[#54D9AE]" : "text-emerald-100/40"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${step > s.n ? "bg-[#187B65]/50" : "bg-[#187B65]/15"}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 text-sm mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {/* Step 1 — Business details */}
          {step === 1 && (
            <form
              onSubmit={(e) => { e.preventDefault(); persist(); goStep(2); }}
              className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-7"
            >
              <h1 className="text-2xl font-extrabold tracking-tight admin-headline">Tell us about your business</h1>
              <p className="text-sm text-emerald-100/60 mt-2 mb-6">This becomes your isolated company workspace. Your business email will be your login.</p>

              <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3">Choose your plan</div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {Object.entries(PLANS).map(([key, p]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setPlan(key)}
                    className={`rounded-2xl border p-3 text-left transition-colors ${plan === key ? "border-[#187B65] bg-[#187B65]/10" : "border-[#187B65]/20 hover:border-[#187B65]/50"}`}
                  >
                    <div className="font-bold text-[#54D9AE] text-sm">{p.name}</div>
                    <div className="text-xs text-emerald-100/60 mt-0.5">${p.monthly}/mo</div>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input" placeholder="Company name" />
                <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="input" placeholder="Your name" />
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="Business email (your login)" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="Phone (optional)" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="City" />
                  <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="input">
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <button className="mt-6 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3.5 hover:bg-[#125C4E] transition-colors flex items-center justify-center gap-2">
                Create your account <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-xs text-emerald-100/40 mt-4">
                Already have a login? <Link to="/login?returnTo=%2Fsoftware%2Fstart%3Fstep%3D3" className="text-[#187B65] font-semibold hover:underline">Sign in</Link> and pick up at the subscription step.
              </p>
            </form>
          )}

          {/* Step 2 — Account creation & verification */}
          {step === 2 && (
            <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-7">
              {authState === "checking" ? (
                <div className="flex items-center justify-center gap-2 py-10 text-emerald-100/60">
                  <Loader2 className="w-5 h-5 animate-spin" /> Checking your session…
                </div>
              ) : authState === "signed_in" ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-10 h-10 text-[#187B65] mx-auto" />
                  <h1 className="text-2xl font-extrabold tracking-tight admin-headline mt-4">You're signed in</h1>
                  <p className="text-sm text-emerald-100/60 mt-2">{form.email} is verified and ready. Continue to start your license subscription.</p>
                  <button onClick={() => goStep(3)} className="mt-6 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3.5 hover:bg-[#125C4E] transition-colors flex items-center justify-center gap-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : authState === "other_account" ? (
                <div className="py-4">
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    You're signed in with a different account than {form.email}. Go back and use your signed-in email as the business email, or sign in as {form.email} instead.
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => goStep(1)} className="flex-1 rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-5 py-3 hover:bg-[#187B65]/10 transition-colors">Back to business details</button>
                    <Link to="/login?returnTo=%2Fsoftware%2Fstart%3Fstep%3D3" className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 text-center hover:bg-[#125C4E] transition-colors">Sign in</Link>
                  </div>
                </div>
              ) : showOtp ? (
                <div className="text-center py-2">
                  <Mail className="w-10 h-10 text-[#187B65] mx-auto" />
                  <h1 className="text-2xl font-extrabold tracking-tight admin-headline mt-4">Verify your email</h1>
                  <p className="text-sm text-emerald-100/60 mt-2 mb-6">We sent a 6-digit code to {form.email}. Enter it below to verify your account.</p>
                  <div className="flex justify-center mb-5">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus autoComplete="one-time-code">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                        <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <button
                    onClick={verify}
                    disabled={busy || otp.length < 6}
                    className="w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3.5 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <>Verify &amp; continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <p className="text-center text-sm text-emerald-100/50 mt-4">
                    Didn't receive it?{" "}
                    <button onClick={resend} className="text-[#187B65] font-semibold hover:underline">Resend code</button>
                  </p>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-extrabold tracking-tight admin-headline">Create your account</h1>
                  <p className="text-sm text-emerald-100/60 mt-2 mb-6">Your login for {form.company} — {form.email}. We'll email a verification code next.</p>
                  <div className="space-y-3">
                    <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="input" placeholder="Password (min 8 characters)" autoComplete="new-password" />
                    <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="input" placeholder="Confirm password" autoComplete="new-password" />
                  </div>
                  <button
                    onClick={startSignup}
                    disabled={busy || !pw || !pw2}
                    className="mt-5 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3.5 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code…</> : <>Send verification code <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <button onClick={() => goStep(1)} className="mt-4 w-full rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-6 py-3 hover:bg-[#187B65]/10 transition-colors">
                    <ArrowLeft className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Back
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 3 — Initiate the license subscription */}
          {step === 3 && (
            <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-7">
              <h1 className="text-2xl font-extrabold tracking-tight admin-headline">Start your subscription</h1>
              <p className="text-sm text-emerald-100/60 mt-2 mb-6">
                Review your license, then we'll take you to secure PayPal checkout for the one-time setup fee and your monthly subscription. Your dashboard is provisioned automatically once PayPal verifies payment.
              </p>

              <div className="rounded-2xl bg-black/20 border border-[#187B65]/20 p-5 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#54D9AE]">{PLANS[plan].name} plan</div>
                    <div className="text-xs text-emerald-100/60 mt-0.5">{form.company} · {form.city || "Canada"}{form.province ? ", " + form.province : ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-white">${PLANS[plan].monthly}<span className="text-xs font-semibold text-emerald-100/50">/mo CAD</span></div>
                    <div className="text-xs text-emerald-100/60">+ {money(PLANS[plan].setup)} setup</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#187B65]/10 text-xs text-emerald-100/60 flex flex-wrap gap-x-6 gap-y-1">
                  <span>Contact: {form.contact_name}</span>
                  <span>Login: {form.email}</span>
                </div>
              </div>

              {[
                "Pay the one-time setup fee with PayPal",
                "Start the monthly license subscription",
                "Your isolated company dashboard is provisioned automatically",
              ].map((t, i) => (
                <div key={t} className="flex items-center gap-2.5 text-sm text-emerald-100/80 mb-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#187B65]/15 text-[#187B65] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span> {t}
                </div>
              ))}

              <button
                onClick={startSubscription}
                disabled={busy}
                className="mt-6 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3.5 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing checkout…</> : <><Rocket className="w-4 h-4" /> Initiate subscription</>}
              </button>
              <button onClick={() => goStep(1)} className="mt-4 w-full rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-6 py-3 hover:bg-[#187B65]/10 transition-colors">
                <ArrowLeft className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Edit business details
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 mt-10 text-emerald-100/40 text-xs">
            <Recycle className="w-3.5 h-3.5 text-[#187B65]" /> Same Day Recycling OS · Secured by PayPal
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}