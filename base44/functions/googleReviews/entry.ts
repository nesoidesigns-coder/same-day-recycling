import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Cities we serve — most specific names first so e.g. "North Vancouver"
// matches before the generic "Vancouver" when attributing a review.
const CITY_NAMES = [
  "North Vancouver",
  "West Vancouver",
  "Vancouver",
  "Burnaby",
  "Richmond",
  "Surrey",
  "Coquitlam",
  "Kamloops",
  "Kelowna",
];

const SEARCH_QUERY = "Same Day Recycling Vancouver BC";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const apiKey = secrets.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return Response.json({
        error: "GOOGLE_PLACES_API_KEY is not set yet. Add it in the app dashboard's Secrets page, then sync again."
      }, { status: 400 });
    }

    // 1. Find the Google Business listing
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount"
      },
      body: JSON.stringify({ textQuery: SEARCH_QUERY }),
      signal: AbortSignal.timeout(10000)
    });
    const search = await searchRes.json();
    const place = search?.places?.[0];
    if (!place?.id) {
      return Response.json({ error: "Could not find the Google Business listing for this search." }, { status: 404 });
    }

    // 2. Fetch the listing details including its reviews (Google returns the latest 5)
    const detailRes = await fetch(`https://places.googleapis.com/v1/places/${place.id}?languageCode=en`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews"
      },
      signal: AbortSignal.timeout(10000)
    });
    const details = await detailRes.json();
    if (details.error) {
      return Response.json({ error: details.error.message || "Google Places API error." }, { status: 502 });
    }

    // 3. Cache reviews, attributing each to a city when its text mentions one
    const records = (details.reviews || []).map((r) => {
      const text = r.text?.text || "";
      const lower = text.toLowerCase();
      const cityHit = CITY_NAMES.find((c) => lower.includes(c.toLowerCase()));
      return {
        review_id: r.name || `${place.id}_${r.authorAttribution?.displayName || "anon"}_${r.relativePublishTimeDescription || ""}`,
        place_id: place.id,
        author_name: r.authorAttribution?.displayName || "Google reviewer",
        rating: r.rating ?? 5,
        text,
        relative_time: r.relativePublishTimeDescription || "",
        city: cityHit || ""
      };
    });
    if (records.length) {
      await base44.asServiceRole.entities.GoogleReview.upsert(records, { key: "review_id" });
    }

    await base44.asServiceRole.entities.GoogleReviewsMeta.upsert([{
      place_id: place.id,
      business_name: place.displayName?.text || "",
      rating: details.rating ?? null,
      user_rating_count: details.userRatingCount ?? null,
      synced_date: new Date().toISOString().slice(0, 10)
    }], { key: "place_id" });

    return Response.json({
      ok: true,
      place_id: place.id,
      business_name: place.displayName?.text || "",
      rating: details.rating ?? null,
      user_rating_count: details.userRatingCount ?? null,
      synced_reviews: records.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}