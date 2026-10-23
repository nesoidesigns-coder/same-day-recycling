import { secrets } from 'base44:runtime';

// Returns the TomTom live-traffic tile templates for the public maps.
// The key is added to the tile URLs (TomTom keys are domain-restricted in the
// TomTom dashboard); without a key configured the overlay stays off.
export default async function(req) {
  try {
    const key = secrets.get("TOMTOM_TRAFFIC_API_KEY");
    if (!key) return Response.json({ enabled: false, reason: "missing_key" });

    const flow = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${key}`;
    const incidents = `https://api.tomtom.com/traffic/map/4/tile/incidents/s1/{z}/{x}/{y}.png?key=${key}`;

    // Probe one tile so the overlay only turns on when the key is accepted.
    const probe = await fetch(`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/3/1/2.png?key=${key}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!probe.ok) return Response.json({ enabled: false, reason: "key_rejected", status: probe.status });

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