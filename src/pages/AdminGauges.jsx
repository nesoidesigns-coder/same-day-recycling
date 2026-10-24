import { Link } from "react-router-dom";
import BiGaugeBattery from "@/components/admin/gauges/BiGaugeBattery";

// Gauge Wall — every collected business metric as a gauge, the Command
// Centre's primary data view. Data comes from the shared BI calculation layer.
export default function AdminGauges() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Command Centre Gauges</h1>
        <p className="mt-1 text-sm text-slate-600 max-w-2xl">
          All collected business data as readable gauges — real records only, from the shared calculation layer behind every dashboard.
          Edit your targets in <Link to="/admin/analytics" className="font-bold text-[#187B65] hover:underline">Analytics</Link>.
        </p>
      </div>
      <BiGaugeBattery />
    </div>
  );
}