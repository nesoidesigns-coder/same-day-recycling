import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ACTIVE_STATUSES = ["new", "confirmed", "contacted", "scheduled"];
const CACHE_DAYS = 7;
const MAX_STOPS = 20;
const CACHE_TTL_MS = CACHE_DAYS * 24 * 60 * 60 * 1000;

function km(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function orderStops(stops) {
  if (stops.length <= 2) return stops.slice();
  const route = [stops[0]];
  const remaining = stops.slice(1);
  while (remaining.length > 0) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = km(last, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  return route;
}

async function geocode(q) {
  try {
    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=" + encodeURIComponent(q);
    const res = await fetch(url, {
      headers: { "User-Agent": "SameDayRecycling-RouteOptimizer/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    // fall through to unmatched
  }
  return null;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch (e) {}

    if ((body.action || "optimize") === "latest") {
      const res = await base44.entities.RoutePlan.list({ sort: "-created_date", limit: 1 });
      const items = res.items || res;
      return Response.json({ plan: items[0] || null });
    }

    const { items: bookings } = await base44.entities.Booking.filter(
      { status: { $in: ACTIVE_STATUSES } },
      { sort: "created_date", limit: MAX_STOPS }
    );

    if (!bookings || bookings.length === 0) {
      return Response.json({ plan: null, message: "No active jobs to route." });
    }

    // Reuse recent coordinates so unchanged addresses are not geocoded again.
    const cache = {};
    try {
      const lastRes = await base44.entities.RoutePlan.list({ sort: "-created_date", limit: 1 });
      const lastItems = lastRes.items || lastRes;
      const prev = lastItems[0];
      if (prev && prev.plan_date && Date.now() - new Date(prev.plan_date).getTime() < CACHE_TTL_MS) {
        for (const s of prev.stops || []) {
          if (s.booking_id && s.address && s.lat != null) {
            cache[s.booking_id + "|" + s.address] = { lat: s.lat, lng: s.lng };
          }
        }
      }
    } catch (e) {}

    const matched = [];
    const unmatched = [];
    let lastCall = 0;
    for (const b of bookings) {
      const key = b.id + "|" + b.address;
      let coords = cache[key] || null;
      if (!coords) {
        const wait = 1100 - (Date.now() - lastCall);
        if (wait > 0) await new Promise((r) => setTimeout(r, wait));
        coords = await geocode([b.address, b.city, "Canada"].filter(Boolean).join(", "));
        lastCall = Date.now();
      }
      if (coords) {
        matched.push({ booking_id: b.id, name: b.name, address: b.address, city: b.city || "", lat: coords.lat, lng: coords.lng });
      } else {
        unmatched.push({ booking_id: b.id, name: b.name, address: b.address, city: b.city || "" });
      }
    }

    if (matched.length === 0) {
      return Response.json({ plan: null, message: "Could not geolocate any active jobs yet.", unmatched });
    }

    // Cluster by city, then order each cluster nearest-neighbour.
    const clusters = {};
    for (const s of matched) {
      const key = (s.city || "Unassigned").trim().toLowerCase();
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(s);
    }

    const stops = [];
    let totalKm = 0;
    let unoptimizedKm = 0;
    let num = 0;
    for (const key of Object.keys(clusters)) {
      const ordered = orderStops(clusters[key]);
      let prev = null;
      for (const s of ordered) {
        const leg = prev ? km(prev, s) : 0;
        s.leg_km = Math.round(leg * 10) / 10;
        s.stop_number = ++num;
        s.cluster = key;
        totalKm += leg;
        prev = s;
        stops.push(s);
      }
      let prevU = null;
      for (const s of clusters[key]) {
        if (prevU) unoptimizedKm += km(prevU, s);
        prevU = s;
      }
    }

    const savedKm = Math.max(0, Math.round((unoptimizedKm - totalKm) * 10) / 10);
    const plan = await base44.entities.RoutePlan.create({
      plan_date: new Date().toISOString(),
      stop_count: matched.length,
      cluster_count: Object.keys(clusters).length,
      total_km: Math.round(totalKm * 10) / 10,
      unoptimized_km: Math.round(unoptimizedKm * 10) / 10,
      saved_km: savedKm,
      unmatched_count: unmatched.length,
      stops,
    });

    return Response.json({ plan, unmatched: unmatched.length ? unmatched : undefined });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}