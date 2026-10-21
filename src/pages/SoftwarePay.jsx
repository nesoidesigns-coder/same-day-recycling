import { useEffect, useState } from "react";
import { useSEO } from "@/lib/seo";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, Recycle, CreditCard, Repeat } from "lucide-react";
import PayPalButtons from "@/components/pay/PayPalButtons";

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA");

export default function SoftwarePay() {
  useSEO({
    title: "Complete Your Payment | Same Day Recycling",
    description: "Secure checkout for your Same Day Recycling OS license.",
    path: "/software-pay",
    robots: "noindex, nofollow",
  });
  const params = new URLSearchParams(window.location.search);
  const payToken = params.get("pay") || "";
  const subReturn = params.get("token") || "";
  const cancelled = params.get("cancelled") === "1";

  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(!!subReturn);
  const [error, setError] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [cycle, setCycle] = useState("monthly");

  const loadLicense = async () => {
    if (!payToken) {
      setError("This payment link is missing its code.");
      setLoading(false);
      return;
    }
    const { data } = await base44.functions.invoke("paypalCheckout", { action: "get_license", pay_token: payToken });
    setLicense(data);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        if (subReturn) {
          await base44.functions.invoke("paypalCheckout", { action: "verify_subscription", pay_token: payToken, subscription_id: subReturn });
        }
        await loadLicense();
        setVerifying(false);
      } catch (e) {
        setError(e?.response?.data?.error || e.message || "Something went wrong.");
        setLoading(false);
        setVerifying(false);
      }
    })();
  }, []);

  const subscribe = async () => {
    setSubscribing(true);
    try {
      const { data } = await base44.functions.invoke("paypalCheckout", { action: "create_subscription", pay_token: payToken, target: "license", billing_cycle: cycle });
      if (data.approve_url) window.location.href = data.approve_url;
      else setSubscribing(false);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not start the subscription.");
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="w-10 h-10 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </span>
          <span className="font-bold text-[#102B2A] text-lg">Same Day Recycling OS</span>
        </div>

        {loading || verifying ? (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin" /> {verifying ? "Verifying payment and provisioning…" : "Loading license details…"}
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl bg-white border border-slate-100 p-6 text-center">
              <h1 className="text-2xl font-bold text-[#102B2A]">{license.company}</h1>
              <p className="text-sm text-slate-500 mt-1">Software license · {license.plan} plan · {license.contact_name}</p>
            </div>

            {cancelled && (
              <p className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                The subscription was cancelled — no charge was made.
              </p>
            )}

            <div className="rounded-3xl bg-white border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-[#187B65]" />
                <h2 className="font-bold text-[#102B2A]">One-time setup fee</h2>
                <span className="ml-auto font-bold text-[#102B2A]">{money(license.setup_fee)}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">Activates your license and prepares your company dashboard.</p>
              {license.setup_paid ? (
                <p className="flex items-center gap-1.5 font-semibold text-[#187B65]">
                  <CheckCircle2 className="w-5 h-5" /> Setup fee paid — thank you!
                </p>
              ) : (
                <PayPalButtons
                  createPayload={{ kind: "license_setup", pay_token: payToken }}
                  onPaid={() => loadLicense().catch(() => {})}
                />
              )}
            </div>

            <div className="rounded-3xl bg-white border border-slate-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Repeat className="w-5 h-5 text-[#187B65]" />
                <h2 className="font-bold text-[#102B2A]">License subscription</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setCycle("monthly")}
                  className={`rounded-xl px-3 py-2.5 text-sm font-bold border transition-colors ${cycle === "monthly" ? "border-[#187B65] bg-[#187B65]/10 text-[#102B2A]" : "border-slate-200 text-slate-500 hover:border-[#187B65]/50"}`}
                >
                  Monthly · {money(license.monthly_fee)}/mo
                </button>
                <button
                  onClick={() => setCycle("annual")}
                  className={`rounded-xl px-3 py-2.5 text-sm font-bold border transition-colors ${cycle === "annual" ? "border-[#187B65] bg-[#187B65]/10 text-[#102B2A]" : "border-slate-200 text-slate-500 hover:border-[#187B65]/50"}`}
                >
                  Annual · {money(license.monthly_fee * 10)}/yr
                  <span className="block text-[10px] font-bold text-[#187B65]">2 months free</span>
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Recurring {cycle === "annual" ? "annual (10x monthly, billed yearly)" : "monthly"} billing through PayPal. Once verified, your account is provisioned automatically and
                your login is emailed to you.
              </p>
              {license.subscription_active ? (
                <p className="flex items-center gap-1.5 font-semibold text-[#187B65]">
                  <CheckCircle2 className="w-5 h-5" /> Subscription active — your company dashboard is being provisioned.
                </p>
              ) : (
                <button
                  onClick={subscribe}
                  disabled={subscribing}
                  className="w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3.5 hover:bg-[#125C4E] transition-colors disabled:opacity-60"
                >
                  {subscribing ? "Starting…" : "Subscribe with PayPal"}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">Secure payments by PayPal · Same Day Recycling OS · samedayrecycling.ca</p>
      </div>
    </div>
  );
}