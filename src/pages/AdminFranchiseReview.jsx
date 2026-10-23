import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Scale, AlertTriangle, FileSearch, Save, RefreshCw } from "lucide-react";
import { MEMBERSHIP_TIERS } from "@/lib/contractorTerms";

const CATEGORIES = [
  { key: "brand_licensing", label: "Brand licensing", hint: "Terms that let the contractor operate under the Same Day Recycling brand or marks" },
  { key: "operating_control", label: "Operating control", hint: "Standards the network imposes on how the contractor operates (service standards, pricing floors, dispatch rules)" },
  { key: "territorial_rights", label: "Territorial rights", hint: "Anything that describes, limits or reopens a territory" },
  { key: "required_fees", label: "Required fees", hint: "Membership, activation, commissions or other charges the contractor must pay" },
  { key: "marketing_assistance", label: "Marketing assistance", hint: "Pages, ads, SEO, follow-ups or other marketing the network provides or controls" },
  { key: "exit_or_renewal", label: "Exit & renewal", hint: "Cancellation, renewal and non-renewal terms" },
];

const STATUS_STYLE = {
  pending_legal_review: "bg-slate-50 border-slate-200 text-slate-600",
  in_review: "bg-amber-50 border-amber-200 text-amber-700",
  review_complete: "bg-[#187B65]/10 border-[#187B65]/30 text-[#187B65]",
};

// Franchise Classification Review — administrator-only.
// Flags membership terms touching franchise-relevant factors so Canadian legal
// counsel can assess provincial franchise-law applicability. This module NEVER
// classifies the business as franchise-exempt and never renders legal conclusions.
export default function AdminFranchiseReview() {
  const [agreements, setAgreements] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");

  const load = async () => {
    const [a, r] = await Promise.all([
      base44.entities.ContractorAgreement.filter({}, { sort: "-created_date", limit: 50 }),
      base44.entities.FranchiseReview.filter({}, { sort: "-created_date", limit: 50 }),
    ]);
    setAgreements((a.items || a) || []);
    setReviews(r.items || r || []);
  };
  useEffect(() => { load().catch(() => setAgreements([])); }, []);

  const buildItems = (agreement) => {
    const items = [];
    const add = (category, term) => items.push({ category, term, flagged: true, note: "" });
    if (!agreement) {
      add("brand_licensing", "Membership includes territory pages published under the Same Day Recycling brand and domain.");
      add("operating_control", "Network standards apply to every member: same-day service standard, upfront pricing honoured, network pricing floor of $139.");
      add("territorial_rights", "Territories are membership seats in a shared market; territory pages stay on the platform's domain; a territory reopens when a member exits.");
      MEMBERSHIP_TIERS.forEach((t) => add("required_fees", `Membership tier "${t.name}": $${t.monthly}/month, billed monthly, plus a one-time territory activation of $250–$500.`));
      add("required_fees", "Commissions apply only if the written agreement says so, and only for the job sources it lists — never a default charge.");
      add("marketing_assistance", "The network builds and maintains the member's city and service pages, runs ads and SEO, and answers calls/messages 24/7.");
      add("exit_or_renewal", "Cancel any time with written notice; agreement default is 30 days' notice; no auto-renewal beyond monthly billing.");
      return items;
    }
    const a = agreement;
    if (a.agreement_type) add("brand_licensing", `Agreement type: ${a.agreement_type} for ${a.partner_name || a.partner_email || "partner"}.`);
    if ((a.territory_subscription?.territory_cities || []).length) add("territorial_rights", `Territory cities listed: ${a.territory_subscription.territory_cities.join(", ")}.`);
    if (a.territory_subscription?.is_flat_fee_subscription) add("territorial_rights", `Flat-fee territory subscription: $${a.territory_subscription.monthly_rate || 0}/${a.territory_subscription.billing_cycle || "monthly"}; ${a.territory_subscription.cancellation_notice_days || 30} days' cancellation notice.`);
    if (a.territory_subscription?.lead_delivery_commitment) add("territorial_rights", `Lead delivery commitment on record: "${a.territory_subscription.lead_delivery_commitment}".`);
    if (Number(a.membership_fee_monthly) > 0) add("required_fees", `Monthly membership fee: $${a.membership_fee_monthly}.`);
    if (Number(a.territory_subscription?.activation_fee) > 0) add("required_fees", `Activation fee: $${a.territory_subscription.activation_fee}.`);
    if (a.fee_model && a.fee_model !== "none") add("required_fees", `Fee model: ${a.fee_model}${a.fee_model === "percentage" ? ` at ${a.fee_percent}%` : a.fee_model === "fixed" ? ` at $${a.fee_fixed_amount}` : ""} — applies to sources: ${(a.applies_to_sources || []).join(", ") || "(none listed)"}.`);
    add("marketing_assistance", `Network provides marketing support (pages, SEO, dispatch offers) per the "${a.agreement_type || "network"}" agreement.`);
    if (a.territory_subscription?.cancellation_notice_days) add("exit_or_renewal", `Cancellation notice: ${a.territory_subscription.cancellation_notice_days} days (written notice; territory reopens when the agreement ends).`);
    return items;
  };

  const ensureReview = async (subject, scope, agreementId, agreement) => {
    const existing = reviews.find((r) => (agreementId ? r.agreement_id === agreementId : r.scope === "membership_program"));
    if (existing) return existing;
    await base44.entities.FranchiseReview.create({
      subject, scope, agreement_id: agreementId || "", items: buildItems(agreement),
      counsel_status: "pending_legal_review", counsel_notes: "",
      history: [{ date: new Date().toISOString(), event: "created", note: "Risk factors flagged for legal review." }],
    });
    await load();
    return reviews.find((r) => (agreementId ? r.agreement_id === agreementId : r.scope === "membership_program"));
  };

  const save = async (review, patch) => {
    setBusy(true);
    try {
      await base44.entities.FranchiseReview.update(review.id, {
        ...patch,
        review_date: new Date().toISOString().slice(0, 10),
        history: [...(review.history || []), { date: new Date().toISOString(), event: patch.counsel_status ? "counsel_status_updated" : "items_updated", note: patch.counsel_status ? `Status set to ${patch.counsel_status.replace(/_/g, " ")}.` : "Flags or notes updated." }],
      });
      setSaved(review.id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const flaggedCount = (r) => (r.items || []).filter((i) => i.flagged).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Franchise Classification Review</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Flags membership terms involving brand licensing, operating control, territorial rights, required fees and
            marketing assistance for review by Canadian legal counsel. This module does not classify the business as
            franchise-exempt and produces no legal conclusions — counsel determines applicability.
          </p>
        </div>
        <button onClick={load} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#102B2A] ${busy ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Administrator tool only. Flags are risk factors for counsel's review, not legal findings. Do not treat any
          status here as a determination of franchise status under provincial law (e.g. Ontario's Wishart Act, BC's Franchises Act, Alberta's Franchises Act).
        </p>
      </div>

      {agreements === null ? (
        <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading agreements…</div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Membership program (no agreement record exists for it) */}
          <ProgramCard
            title="Membership program (all tiers)"
            subject="Membership program"
            reviews={reviews.filter((r) => r.scope === "membership_program")}
            ensureReview={ensureReview}
            save={save}
            busy={busy}
            saved={saved}
          />
          {(agreements.length ? agreements : []).map((a) => (
            <ProgramCard
              key={a.id}
              title={`${a.partner_name || a.partner_email || "Partner"} — ${a.agreement_type || "agreement"}`}
              subject={`${a.partner_name || a.partner_email || "Partner"} agreement`}
              agreementId={a.id}
              agreement={a}
              reviews={reviews.filter((r) => r.agreement_id === a.id)}
              ensureReview={ensureReview}
              save={save}
              busy={busy}
              saved={saved}
            />
          ))}
          {agreements.length === 0 && (
            <p className="text-sm text-slate-500">No contractor agreements on file yet — the membership-program review covers all tiers.</p>
          )}
        </div>
      )}
    </div>
  );

  function ProgramCard({ title, subject, agreementId, agreement, reviews: mine, ensureReview, save: saveReview, busy: busyState, saved }) {
    const review = mine[0];
    const categoryLabel = (k) => CATEGORIES.find((c) => c.key === k)?.label || k;
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-[#187B65]" />
            <h2 className="text-base font-bold text-[#102B2A]">{title}</h2>
          </div>
          {review ? (
            <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[review.counsel_status] || STATUS_STYLE.pending_legal_review}`}>
              {review.counsel_status.replace(/_/g, " ")}
            </span>
          ) : (
            <button onClick={() => ensureReview(subject, agreementId ? "contractor_agreement" : "membership_program", agreementId, agreement)} className="rounded-full bg-[#187B65] text-white font-bold px-4 py-2 text-xs hover:bg-[#125C4E] transition-colors">
              Start review
            </button>
          )}
        </div>

        {review ? (
          <>
            <div className="space-y-2">
              {(review.items || []).map((item, idx) => (
                <div key={idx} className={`rounded-xl border px-3.5 py-3 ${item.flagged ? "border-amber-200 bg-amber-50/60" : "border-slate-100 bg-slate-50"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${item.flagged ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>
                      {categoryLabel(item.category)}
                    </span>
                    <label className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <input
                        type="checkbox"
                        checked={!!item.flagged}
                        onChange={(e) => {
                          const items = review.items.map((it, i) => (i === idx ? { ...it, flagged: e.target.checked } : it));
                          saveReview(review, { items });
                        }}
                        className="accent-[#187B65]"
                      /> Flagged
                    </label>
                  </div>
                  <p className="mt-1.5 text-sm text-[#102B2A] leading-relaxed">{item.term}</p>
                  <input
                    value={item.note || ""}
                    onChange={(e) => {
                      const items = review.items.map((it, i) => (i === idx ? { ...it, note: e.target.value } : it));
                      setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, items } : r)));
                    }}
                    onBlur={() => saveReview(review, { items: review.items })}
                    placeholder="Note for counsel…"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-[#102B2A] focus:border-[#187B65] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Counsel review status</div>
                <select
                  value={review.counsel_status}
                  onChange={(e) => saveReview(review, { counsel_status: e.target.value, reviewed_by: review.reviewed_by || "" })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#102B2A] focus:border-[#187B65] focus:outline-none"
                >
                  <option value="pending_legal_review">Pending legal review</option>
                  <option value="in_review">In review</option>
                  <option value="review_complete">Review complete (counsel)</option>
                </select>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Counsel notes (working notes only)</div>
                <textarea
                  value={review.counsel_notes || ""}
                  onChange={(e) => setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, counsel_notes: e.target.value } : r)))}
                  onBlur={() => saveReview(review, { counsel_notes: review.counsel_notes })}
                  rows={3}
                  placeholder="Counsel's working notes — no legal conclusions are recorded by this system."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#102B2A] focus:border-[#187B65] focus:outline-none"
                />
              </div>
            </div>
            {saved === review.id && <p className="mt-2 text-[11px] text-[#187B65] inline-flex items-center gap-1"><Save className="w-3 h-3" /> Saved.</p>}
            {(review.history || []).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                {review.history.map((h, i) => <span key={i} className="mr-3">{String(h.date || "").slice(0, 10)} · {h.event}</span>)}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">No review started for this subject yet. Starting one flags every franchise-relevant term automatically for counsel to assess.</p>
        )}
      </div>
    );
  }
}