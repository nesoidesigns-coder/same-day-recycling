import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

let sdkPromise = null;
function loadSdk(clientId, currency) {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}`;
    s.onload = () => resolve(window.paypal);
    s.onerror = () => reject(new Error("Could not load PayPal"));
    document.body.appendChild(s);
  });
  return sdkPromise;
}

export default function PayPalButtons({ createPayload, onPaid, onError, onCancel }) {
  const ref = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: cfg } = await base44.functions.invoke("paypalCheckout", { action: "config" });
        if (!cfg.clientId) throw new Error("PayPal is not configured yet.");
        const paypal = await loadSdk(cfg.clientId, cfg.currency || "CAD");
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        paypal.Buttons({
          style: { layout: "vertical", shape: "pill", color: "black" },
          createOrder: async () => {
            const { data } = await base44.functions.invoke("paypalCheckout", { action: "create_order", ...createPayload });
            return data.orderId;
          },
          onApprove: async (dt) => {
            const { data } = await base44.functions.invoke("paypalCheckout", { action: "capture", order_id: dt.orderID });
            if (onPaid) onPaid(data);
          },
          onCancel: () => { if (onCancel) onCancel(); },
          onError: (err) => {
            setFailed(true);
            if (onError) onError(err);
          },
        }).render(ref.current);
        if (!cancelled) setLoading(false);
      } catch (e) {
        setFailed(true);
        if (!cancelled) setLoading(false);
        if (onError) onError(e);
      }
    })();
    return () => { cancelled = true; };
  }, [JSON.stringify(createPayload)]);

  return (
    <div>
      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading PayPal…
        </div>
      )}
      <div ref={ref} />
      {failed && <p className="text-sm text-red-600 mt-2">PayPal could not be loaded. Please try again later.</p>}
    </div>
  );
}