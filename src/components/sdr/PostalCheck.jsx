import { useState } from "react";
import { MapPin, CheckCircle2, Search, XCircle, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const FSA_RE = /^[A-Z]\d[A-Z](?:\d[A-Z]\d)?$/;

const LETTER_PROVINCE = {
  A: "NL", B: "NS", C: "PE", E: "NB", G: "QC", H: "QC", J: "QC",
  K: "ON", L: "ON", M: "ON", N: "ON", P: "ON",
  R: "MB", S: "SK", T: "AB", V: "BC", X: "NT", Y: "YT",
};

const PROVINCE_NAMES = {
  ON: "Ontario", QC: "Quebec", AB: "Alberta", MB: "Manitoba", NS: "Nova Scotia",
  SK: "Saskatchewan", BC: "British Columbia", NL: "Newfoundland and Labrador",
  NB: "New Brunswick", NT: "Northwest Territories", NU: "Nunavut", YT: "Yukon",
};

const LIVE_BY_PROVINCE = {
  ON: ["Toronto", "Ottawa", "Hamilton", "Mississauga"],
  QC: ["Montreal", "Quebec City"],
  AB: ["Calgary", "Edmonton"],
  MB: ["Winnipeg"],
  SK: ["Regina", "Saskatoon"],
  NS: ["Halifax"],
  BC: ["Vancouver", "Victoria"],
  NB: ["Moncton", "Saint John"],
  NL: ["St. John's"],
  PE: ["Charlottetown"],
  YT: ["Whitehorse"],
  NT: ["Yellowknife"],
  NU: ["Iqaluit"],
};

export default function PostalCheck({ onCity }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);

  const check = (e) => {
    e.preventDefault();
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (!FSA_RE.test(normalized)) {
      setResult({ invalid: true });
      return;
    }
    const province = LETTER_PROVINCE[normalized[0]];
    setResult({ province, cities: LIVE_BY_PROVINCE[province] || [] });
  };

  return (
    <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-5 md:p-6 text-left">
      <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#187B65] mb-2">Check your area</div>
      <h2 className="text-lg font-bold text-[#102B2A] leading-snug">Is same-day pickup live at your door?</h2>
      <form onSubmit={check} className="mt-4 grid gap-3" aria-label="Postal code service check">
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <label htmlFor="postal-check" className="sr-only">Enter your postal code</label>
          <input
            id="postal-check"
            value={value}
            onChange={(e) => { setValue(e.target.value); setResult(null); }}
            placeholder="Enter your postal code (e.g. M5V 2T6)"
            autoComplete="postal-code"
            className="input !bg-slate-50 pl-10"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#187B65] text-[#102B2A] font-bold text-base uppercase tracking-wide px-6 py-3.5 hover:bg-[#1FA184] transition-colors"
        >
          Check my area
        </button>
      </form>

      {result?.invalid && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          Enter a valid Canadian postal code, like M5V 2T6.
        </div>
      )}

      {result?.province && (
        <div className="mt-4 rounded-xl bg-[#f4f7f5] border border-[#187B65]/20 px-4 py-4">
          {result.cities.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A]">
                <CheckCircle2 className="w-4 h-4 text-[#187B65]" />
                Same-day pickup is live in {PROVINCE_NAMES[result.province]}
              </div>
              <div className="mt-3 grid gap-2">
                {result.cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => onCity?.(city)}
                    className="flex items-center justify-between rounded-xl bg-white border border-slate-100 px-4 py-3 text-sm font-bold text-[#102B2A] hover:border-[#187B65] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#187B65]" /> Book in {city}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#187B65]" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2 text-sm font-bold text-[#102B2A]">
                <Search className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" />
                <span>
                  Same-day pickup isn't live in {PROVINCE_NAMES[result.province]} yet.
                  <span className="block font-medium text-slate-600 mt-1">
                    Our nationwide directory still lists verified recycling providers near you.
                  </span>
                </span>
              </div>
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                <Link
                  to={`/recycling?loc=${encodeURIComponent(PROVINCE_NAMES[result.province])}`}
                  className="rounded-xl bg-white border border-slate-100 px-4 py-3 text-sm font-bold text-[#102B2A] hover:border-[#187B65] transition-colors text-center"
                >
                  Browse the directory
                </Link>
                <Link
                  to="/contractor-onboarding"
                  className="rounded-xl bg-[#102B2A] text-white px-4 py-3 text-sm font-bold hover:bg-[#0a3020] transition-colors text-center"
                >
                  Bring it to your city
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}