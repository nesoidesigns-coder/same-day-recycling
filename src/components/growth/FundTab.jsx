import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { Section, EmptyNote, money } from "./growthShared";

export default function FundTab({ data, onSaved }) {
  const { toast } = useToast();
  const fund = data?.fund;
  const [allocation, setAllocation] = useState(0);
  const [operating, setOperating] = useState(0);
  const [reserve, setReserve] = useState(0);
  const [program, setProgram] = useState("off");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (fund) {
      setAllocation(fund.allocation_pct || 0);
      setOperating(fund.monthly_operating_costs || 0);
      setProgram(fund.contributions_program_status || "off");
    }
    if (data?.cash) setReserve(data.cash.available_reserve || 0);
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        allocation_pct: Number(allocation) || 0,
        monthly_operating_costs: Number(operating) || 0,
        available_cash_reserve: Number(reserve) || 0,
        contributions_program_status: program,
      };
      const historyEntry = { date: new Date().toISOString(), event: "fund_settings_updated", note: `allocation ${allocation}% · operating ${money(operating)}` };
      if (fund?.settings_id) {
        const current = await base44.entities.NetworkGrowthSettings.get(fund.settings_id);
        await base44.entities.NetworkGrowthSettings.update(fund.settings_id, { ...payload, history: [...(current.history || []), historyEntry] });
      } else {
        await base44.entities.NetworkGrowthSettings.create({ ...payload, history: [historyEntry] });
      }
      toast({ title: "Growth Fund settings saved", description: "Planning figures updated. Nothing is spent automatically." });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const setActiveStatus = async (contrib, status) => {
    await base44.entities.MarketingContribution.update(contrib.id, { status });
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <Section title="Network Growth Fund" note="The portion of eligible net contractor revenue the owner chooses to allocate toward consumer acquisition. A planning figure only — the owner approves every advertising commitment; the system never spends automatically.">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="col-span-2 rounded-xl border border-brand-emerald/30 bg-brand-softmint/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Potential advertising budget (planning)</p>
            <p className="mt-1 text-3xl font-bold text-[#102B2A]">{money(fund?.planning_budget || 0)}<span className="text-sm font-semibold text-slate-500"> /month</span></p>
            <p className="mt-1 text-xs text-slate-500">{fund?.base_revenue ? `${money(fund.base_revenue)} collected MRR − ${money(fund.monthly_operating_costs)} operating = ${money(fund.fund_base)} × ${fund.allocation_pct}%` : "Set subscription revenue and operating costs below to compute."}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collected MRR (fund base)</p>
            <p className="mt-1 text-2xl font-bold text-[#102B2A]">{money(fund?.base_revenue || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Optional contributions (active)</p>
            <p className="mt-1 text-2xl font-bold text-[#102B2A]">{money(data?.contributions_active_total || 0)}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-sm font-semibold text-[#102B2A]">Allocation % of net revenue
            <input type="number" min="0" max="100" value={allocation} onChange={(e) => setAllocation(e.target.value)} className="input mt-1" />
          </label>
          <label className="text-sm font-semibold text-[#102B2A]">Monthly operating costs
            <input type="number" min="0" value={operating} onChange={(e) => setOperating(e.target.value)} className="input mt-1" />
          </label>
          <label className="text-sm font-semibold text-[#102B2A]">Cash reserve on hand
            <input type="number" min="0" value={reserve} onChange={(e) => setReserve(e.target.value)} className="input mt-1" />
          </label>
          <label className="text-sm font-semibold text-[#102B2A]">Contribution program
            <select value={program} onChange={(e) => setProgram(e.target.value)} className="input mt-1">
              <option value="off">Off</option>
              <option value="open">Open to contractors</option>
              <option value="paused">Paused</option>
            </select>
          </label>
        </div>
        <button onClick={save} disabled={saving} className="mt-4 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
          {saving ? "Saving…" : "Save fund settings"}
        </button>
        <p className="mt-2 text-xs text-slate-500">Hosting, processing fees, taxes, support and operating expenses must be covered before committing advertising funds. Allocation never goes negative and never spends on its own.</p>
      </Section>

      <Section title="Optional contractor marketing contributions" note="Voluntary, separately authorized contributions targeting contractors' own verified territories. Never guaranteed leads, rankings or revenue — and never an investment or profit-sharing arrangement.">
        {data?.contributions?.length ? (
          <div className="space-y-2">
            {data.contributions.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-bold text-[#102B2A]">{c.partner_name || c.partner_email}</p>
                  <p className="text-xs text-slate-500">{(c.territory_cities || []).join(", ") || "No territory set"} · limit {money(c.monthly_limit)}/mo · {c.status}{c.authorized_date ? ` · authorized ${c.authorized_date}` : " · not authorized"}</p>
                </div>
                <div className="flex gap-2">
                  {c.status !== "active" && <button onClick={() => setActiveStatus(c, "active")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#102B2A] hover:bg-slate-50">Mark active</button>}
                  {c.status === "active" && <button onClick={() => setActiveStatus(c, "paused")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#102B2A] hover:bg-slate-50">Pause</button>}
                  {c.status !== "cancelled" && <button onClick={() => setActiveStatus(c, "cancelled")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">Cancel</button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>No contractor marketing contributions on record. Contributions require explicit written authorization and payment setup before any campaign spend.</EmptyNote>
        )}
      </Section>
    </div>
  );
}