import AcquisitionDashboard from "@/components/admin/acquisition/AcquisitionDashboard";

// Customer Acquisition: the live traffic-intelligence dashboard. One shared
// reporting layer (visitStats) powers every figure here — reconciled windows,
// evidence-based attribution, and owner/bot traffic tracked separately.
export default function AdminAcquisition() {
  return (
    <div>
      <AcquisitionDashboard />
    </div>
  );
}