import { CheckCircle2, Info } from 'lucide-react';
import MarketObservatory from '@/components/demand/MarketObservatory';
import ValueEnginePanel from '@/components/partner/ValueEnginePanel';
import BizMasterTenantChat from '@/components/partner/BizMasterTenantChat';

// Proposed tier allocation — clearly labeled as a proposal. Current agreements
// and prices stay in force until the owner approves changes, and every tier is
// designed to deliver standalone software value with zero required leads.
const TIERS = [
  {
    name: 'Business Essentials', price: 349,
    features: ['Core booking & scheduling', 'Customer CRM database', 'Estimates & invoicing', 'Basic financial reporting', 'AI Business Master (education)', 'Value measurement dashboard'],
  },
  {
    name: 'Business Professional', price: 499, tag: 'Most value',
    features: ['Everything in Essentials', 'Advanced dispatch & routing', 'Operational analytics', 'Automation & follow-up tools', 'Customer retention toolkit', 'Expanded AI Business Master'],
  },
  {
    name: 'Business Enterprise', price: 999,
    features: ['Everything in Professional', 'Multi-crew management', 'Advanced reporting', 'White-label capabilities where supported', 'Expanded administration', 'Priority business support'],
  },
];

const panel = 'relative rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm';

export default function BusinessHQ() {
  return (
    <section aria-label="Recycling OS Business HQ" className="space-y-5">
      <div className={`${panel} p-5 md:p-6`}>
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]">Recycling OS · Business HQ</div>
        <h2 className="mt-1 text-xl font-bold text-white">Your business headquarters — works with or without platform referrals</h2>
        <p className="mt-2 text-xs text-emerald-100/50 max-w-2xl leading-relaxed">
          Recycling OS is software you pay for because it runs your business better. Platform job referrals from the Same Day Recycling network are an additional opportunity — never a guarantee, and never required. All purchased software features stay available whether or not the network sends you a single lead.
        </p>
      </div>

      <ValueEnginePanel />

      <BizMasterTenantChat />

      <div className="relative rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm p-5 md:p-6">
        <h2 className="text-lg font-bold text-white">National market intelligence</h2>
        <p className="mt-1 text-xs text-emerald-100/50 mb-4">
          Canadian service-demand signals from verified external observations — search trends, regional patterns and seasonal context for planning your own growth. Clearly labeled: some are relative interest, not live search counts.
        </p>
        <MarketObservatory compact />
      </div>

      <div className={`${panel} p-5 md:p-6`}>
        <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-200 mb-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>PROPOSED tier allocation — shown for transparency. Current agreements and prices remain unchanged until the owner approves new plans, and no existing subscription terms change automatically.</span>
        </div>
        <h2 className="text-lg font-bold text-white">Software plans (proposed allocation)</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          {TIERS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-[#187B65]/25 bg-[#0a2b1e]/50 p-5">
              {t.tag && <span className="rounded-full bg-[#187B65]/20 text-[#187B65] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{t.tag}</span>}
              <div className="mt-1 text-sm font-bold text-white">{t.name}</div>
              <div className="text-2xl font-bold text-[#187B65] holo-glow-text mt-1">${t.price}<span className="text-xs text-emerald-100/40 font-normal">/mo</span></div>
              <ul className="mt-3 space-y-1.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-emerald-100/70">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#187B65]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-emerald-100/40">
          Every tier is designed to deliver standalone value without leads: booking, CRM, invoicing, financials and AI education are included at every level. Referral commissions, if a platform lead is accepted, are disclosed before acceptance.
        </p>
      </div>
    </section>
  );
}