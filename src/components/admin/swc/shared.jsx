export const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA");
export const STATUSES = ["provisioning", "setup_paid", "active", "paused", "cancelled"];

export const statusBadge = (status) => {
  if (status === "active") return "bg-[#187B65]/20 text-[#187B65]";
  if (status === "cancelled" || status === "churned") return "bg-red-500/20 text-red-300";
  return "bg-amber-500/20 text-amber-300";
};

export const NotTracked = ({ label = "not tracked" }) => (
  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/30 border border-emerald-100/10 rounded-full px-2 py-0.5">
    {label}
  </span>
);