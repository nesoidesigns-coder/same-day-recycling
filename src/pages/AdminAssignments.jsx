import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AssignTab from "@/components/admin/AssignTab";
import { Loader2 } from "lucide-react";

export default function AdminAssignments() {
  const [partners, setPartners] = useState(null);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Partner.filter({}, { sort: "-created_date", limit: 100 });
      setPartners(items);
    })().catch(() => setPartners([]));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight mb-1">Assignments</h1>
      <p className="text-sm text-slate-500 mb-6">Route unassigned jobs to partner contractors by territory.</p>
      {partners === null ? (
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-12" />
      ) : (
        <AssignTab partners={partners} />
      )}
    </div>
  );
}