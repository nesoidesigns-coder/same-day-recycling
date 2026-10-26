import { useSEO } from "@/lib/seo";
import SiHeader from "@/components/si/SiHeader";
import Footer from "@/components/sdr/Footer";
import ImpactEstimator from "@/components/home/ImpactEstimator";

// The shareable signature tool: customers estimate what their load could be
// donated or recycled instead of landfilled, and share the result.
export default function ImpactCalculator() {
  useSEO({
    title: "Recycling Impact Estimator | Same Day Recycling",
    description: "Estimate how much of your junk load could be donated or recycled instead of landfilled — and share your impact. Same-day pickup across Canada.",
    path: "/impact-calculator",
  });

  return (
    <div className="min-h-screen bg-si-bg font-body text-si-ink">
      <SiHeader />
      <main className="mx-auto max-w-[1280px] px-4 py-10 md:px-8 md:py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-ri-charcoal md:text-5xl">
            What happens to <span className="text-ri-forest">your stuff?</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ri-slate md:text-lg">
            Every load we take is sorted for donation first and recycling second. Estimate your impact below — then share it, or turn it into a free pickup quote.
          </p>
        </div>
        <ImpactEstimator className="mt-8" />
        <p className="mt-6 text-xs text-ri-slate">
          Estimates use published average item weights. Your actual recycling report arrives with your receipt after pickup.
        </p>
      </main>
      <Footer />
    </div>
  );
}