import { Link } from "react-router-dom";
import { Truck, Wrench, ArrowRight } from "lucide-react";

// Signed in, but nothing on file under this email yet. No invented account
// data — just the two real ways to start.
export default function NewCustomerHome({ email }) {
  const actions = [
    {
      to: "/request-service",
      icon: Truck,
      title: "Book a pickup",
      body: "Tell us what needs to go and when. Same-day service where a crew is available.",
    },
    {
      to: "/partner-register",
      icon: Wrench,
      title: "Join as a contractor",
      body: "Run your pickups on Recycling OS — dispatch, payouts, territory and compliance in one place.",
    },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-ri-slate">
        We don't have any pickups or projects under <span className="font-bold text-ri-charcoal">{email}</span> yet. If you
        booked with a different email, sign in with that one and everything will appear here.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.to}
              to={a.to}
              className="group rounded-2xl border border-si-line bg-white p-5 transition-colors hover:border-ri-emerald/40"
            >
              <Icon className="h-5 w-5 text-ri-emerald" />
              <h3 className="mt-2 text-base font-bold text-ri-charcoal">{a.title}</h3>
              <p className="mt-1 text-sm text-ri-slate">{a.body}</p>
              <span className="mt-3 flex items-center gap-1.5 text-xs font-bold text-ri-forest">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}