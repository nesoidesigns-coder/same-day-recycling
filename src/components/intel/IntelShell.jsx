import { Link, useLocation } from "react-router-dom";
import IntelHeader from "./IntelHeader";
import IntelSidebar from "./IntelSidebar";

// The reference frame used by every page: fixed top bar, grouped rail on the
// left, and one content column on the mint canvas. On phones the rail becomes
// a horizontal scroll strip so navigation never disappears.
const MOBILE = [
  { to: "/live", label: "Live" },
  { to: "/services", label: "Services" },
  { to: "/pricing", label: "Pricing" },
  { to: "/coverage", label: "Coverage" },
  { to: "/contractors", label: "Partners" },
  { to: "/community", label: "Community" },
  { to: "/request-service", label: "Book" },
];

export default function IntelShell({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-lm-bg text-lm-ink">
      <IntelHeader />

      <div className="mx-auto flex max-w-[1360px] gap-6 px-4 py-4">
        <IntelSidebar />

        <main className="min-w-0 flex-1">
          <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
            {MOBILE.map(({ to, label }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
                    active
                      ? "border-lm-teal bg-lm-teal text-white"
                      : "border-lm-line bg-lm-surface text-lm-muted"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}