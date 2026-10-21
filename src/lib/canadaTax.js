// Client-side Canadian sales-tax table — mirrors base44/shared/canadaTax.ts
// on the server. Used only to DISPLAY the breakdown before payment; the
// authoritative calculation happens server-side at order creation.
export const TAX_RATES = {
  BC: { label: "GST (5%) + PST (7%)", rate: 0.12 },
  AB: { label: "GST (5%)", rate: 0.05 },
  SK: { label: "GST (5%) + PST (6%)", rate: 0.11 },
  MB: { label: "GST (5%) + RST (8%)", rate: 0.13 },
  ON: { label: "HST (13%)", rate: 0.13 },
  QC: { label: "GST (5%) + QST (9.975%)", rate: 0.14975 },
  NB: { label: "HST (15%)", rate: 0.15 },
  NS: { label: "HST (14%)", rate: 0.14 },
  PE: { label: "HST (15%)", rate: 0.15 },
  NL: { label: "HST (15%)", rate: 0.15 },
  NT: { label: "GST (5%)", rate: 0.05 },
  NU: { label: "GST (5%)", rate: 0.05 },
  YT: { label: "GST (5%)", rate: 0.05 },
};

const CITY_PROVINCE = {
  vancouver: "BC", burnaby: "BC", surrey: "BC", richmond: "BC", coquitlam: "BC",
  victoria: "BC", kamloops: "BC", kelowna: "BC", "maple ridge": "BC", "pitt meadows": "BC",
  "north vancouver": "BC", "west vancouver": "BC", "new westminster": "BC", langley: "BC",
  calgary: "AB", edmonton: "AB", "red deer": "AB", lethbridge: "AB",
  saskatoon: "SK", regina: "SK", winnipeg: "MB",
  toronto: "ON", ottawa: "ON", hamilton: "ON", mississauga: "ON", brampton: "ON",
  london: "ON", kitchener: "ON", windsor: "ON", markham: "ON", vaughan: "ON",
  montreal: "QC", "quebec city": "QC", laval: "QC", gatineau: "QC",
  moncton: "NB", "saint john": "NB", fredericton: "NB",
  halifax: "NS", charlottetown: "PE", "st johns": "NL",
  yellowknife: "NT", whitehorse: "YT", iqaluit: "NU",
};

export function provinceForCity(city) {
  return CITY_PROVINCE[String(city || "").toLowerCase().trim()] || "";
}

export function taxFor(provinceCode, subtotal) {
  const code = String(provinceCode || "").toUpperCase();
  const t = TAX_RATES[code] || { label: "GST (5%) — estimate", rate: 0.05 };
  const subtotalNum = Math.max(0, Number(subtotal) || 0);
  const tax = Math.round(subtotalNum * t.rate * 100) / 100;
  return {
    label: t.label,
    rate: t.rate,
    tax,
    total: Math.round((subtotalNum + tax) * 100) / 100,
    estimated: !TAX_RATES[code],
  };
}