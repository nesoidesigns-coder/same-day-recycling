import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PortalShell from "@/components/portal/PortalShell";
import ContractorHome from "@/components/portal/ContractorHome";
import BusinessHome from "@/components/portal/BusinessHome";
import HouseholdHome from "@/components/portal/HouseholdHome";
import RealtorHome from "@/components/portal/RealtorHome";
import NewCustomerHome from "@/components/portal/NewCustomerHome";

// The customer-facing front door. One signed-in person, every account they
// hold: a contractor, a property manager, a realtor, a household — or several
// at once. Nothing is invented: each block renders only when that account
// actually exists under the signed-in email.
const ROLE_TITLE = {
  contractor: "Your contracting business",
  business: "Your company account",
  realtor: "Your referrals",
  household: "Your pickups",
};

export default function CustomerPortal() {
  const [state, setState] = useState({ stage: "loading", data: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("customerPortal", {});
        setState({ stage: "ready", data: res.data });
      } catch {
        setState({ stage: "error", data: null });
      }
    })();
  }, []);

  if (state.stage === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ri-ivory">
        <Loader2 className="h-7 w-7 animate-spin text-ri-emerald" />
      </div>
    );
  }

  if (state.stage === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ri-ivory px-4 text-center">
        <ShieldAlert className="h-8 w-8 text-ri-amber" />
        <h1 className="text-xl font-bold text-ri-charcoal">We couldn't open your account</h1>
        <p className="max-w-sm text-sm text-ri-slate">
          Your session may have expired. Sign in again and your pickups, jobs and referrals will be here.
        </p>
        <Link to="/login" className="rounded-full bg-ri-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-ri-emerald">
          Sign in
        </Link>
      </div>
    );
  }

  const d = state.data || {};
  const roles = d.roles || [];
  const title = d.name ? `Welcome back, ${String(d.name).split(" ")[0]}` : "Your account";

  return (
    <PortalShell title={title} subtitle="Everything booked under your email, in one place." email={d.email}>
      <div className="space-y-8">
        {!d.has_records && <NewCustomerHome email={d.email} />}

        {d.contractor && (
          <section>
            <h2 className="mb-2 font-plex text-[11px] uppercase tracking-[0.16em] text-ri-slate">{ROLE_TITLE.contractor}</h2>
            <ContractorHome contractor={d.contractor} />
          </section>
        )}

        {d.business && (
          <section>
            <h2 className="mb-2 font-plex text-[11px] uppercase tracking-[0.16em] text-ri-slate">{ROLE_TITLE.business}</h2>
            <BusinessHome business={d.business} bookings={d.household?.bookings || []} />
          </section>
        )}

        {d.realtor && (
          <section>
            <h2 className="mb-2 font-plex text-[11px] uppercase tracking-[0.16em] text-ri-slate">{ROLE_TITLE.realtor}</h2>
            <RealtorHome realtor={d.realtor} />
          </section>
        )}

        {d.household && (
          <section>
            <h2 className="mb-2 font-plex text-[11px] uppercase tracking-[0.16em] text-ri-slate">{ROLE_TITLE.household}</h2>
            <HouseholdHome household={d.household} />
          </section>
        )}

        {roles.length > 1 && (
          <p className="text-xs text-ri-slate">
            This email is linked to more than one kind of account — each one is kept separate above, and nothing is shared between them.
          </p>
        )}
      </div>
    </PortalShell>
  );
}