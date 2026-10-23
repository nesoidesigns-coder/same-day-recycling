import { secrets } from 'base44:runtime';

// Returns the TomTom live-traffic tile templates for the public maps.
// The key is added to the tile URLs (TomTom keys are domain-restricted in the
// TomTom dashboard); without a key configured the overlay stays off.
export default async function(req) {
  try {
    // The stored value may carry stray whitespace, quotes or a label — clean it.
    const raw = String(secrets.get("TOMTOM_TRAFFIC_API_KEY") || "").trim().replace(/^["']|["']$/g, "");
    if (!raw) return Response.json({ enabled: false, reason: "missing_key" });
    // Candidates: the raw value plus any key-like alphanum runs inside it.
    const runs = raw.match(/[A-Za-z0-9]{20,}/g) || [];
    const candidates = [raw, ...runs, ...runs.map((r) => r.slice(0, 32))].filter(Boolean);

    // Probe each candidate — the overlay only turns on once TomTom accepts a key.
    let accepted = null;
    for (const candidate of candidates) {
      const probe = await fetch(`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/3/1/2.png?key=${candidate}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (probe.ok) { accepted = candidate; break; }
    }
    if (!accepted) return Response.json({ enabled: false, reason: "key_rejected", status: 401 });

    const key = accepted;
    const flow = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${key}`;
    const incidents = `https://api.tomtom.com/traffic/map/4/tile/incidents/s1/{z}/{x}/{y}.png?key=${key}`;

    return Response.json({
      enabled: true,
      provider: "TomTom",
      attribution: '&copy; <a href="https://www.tomtom.com">TomTom</a>',
      flow,
      incidents,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}