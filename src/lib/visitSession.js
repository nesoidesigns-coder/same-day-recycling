// Visitor session key: ties one browser session's visits, quote request and
// booking into a single journey record (visit -> quote -> booking) without
// cookies or personal data.
export function getSessionId() {
  try {
    let sid = sessionStorage.getItem("sdr_sid");
    if (!sid) {
      sid = (crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`).slice(0, 36);
      sessionStorage.setItem("sdr_sid", sid);
    }
    return sid;
  } catch {
    return "";
  }
}

// Coarse visitor country, inferred from the device timezone: Canada for
// Canadian zones, otherwise "other". Never treated as precise geolocation.
const CA_ZONES = [
  "America/St_Johns", "America/Halifax", "America/Toronto", "America/Winnipeg",
  "America/Regina", "America/Edmonton", "America/Vancouver", "America/Iqaluit",
  "America/Yellowknife", "America/Whitehorse", "America/Rainy_River", "America/Rankin_Inlet",
];
export function visitorCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return CA_ZONES.includes(tz) ? "CA" : "other";
  } catch {
    return "";
  }
}