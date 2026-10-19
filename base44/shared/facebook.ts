const GRAPH = "https://graph.facebook.com/v25.0";

// Facebook marketing playbook for customer acquisition. Shared by every AI post
// writer (auto post workflow, admin drafts) so all posts market the same way.
export const FB_MARKETING_PLAYBOOK = `Follow these Facebook customer-acquisition rules:
1. HOOK FIRST LINE: the first sentence must stop the scroll (before Facebook's "See more" cut). Use a relatable pain, a bold local claim, or a question. Never open with "We are excited to announce".
2. LOCALIZE: name the city or neighbourhood (Vancouver, Burnaby, Surrey, Richmond, Coquitlam, Kamloops, Kelowna). Mention recognizable local situations: condo move-outs, garage cleanouts, strata turnovers, estate clearances.
3. SELL THE OUTCOME, NOT THE SERVICE: "your garage cleared by dinner", "get the deposit back", "curb appeal for the listing". People buy the result, not the truck.
4. URGENCY YOU CAN HONOUR: same-day service if booked before noon; month-end move-outs, spring cleaning, year-end clearouts.
5. SOCIAL PROOF: weave in recent real jobs ("our crew just cleared a full basement in Surrey"), years in business, or review highlights. Never mention customer names, phone numbers or street addresses.
6. ONE CLEAR CTA: end with exactly one call to action, call or text (604) 849-1745 or book online at samedayrecycling.ca. Add a comment-bait line before it when it fits ("Which room is driving you crazy?") because comments extend reach.
7. KEYWORDS NATURALLY: include phrases locals actually search ("junk removal Vancouver", "same day furniture removal") once, woven into a sentence, never stuffed.
8. STYLE GUARDS: friendly and local, no hype, no em-dashes, no ALL CAPS, max 4 hashtags (mix city + service tags like #VancouverJunkRemoval), 2-4 sentences, under 80 words.`;

// Gets the connected Facebook user token and the first managed Page's token.
// Enumerates both directly-managed pages (/me/accounts) and Business-Manager-owned
// pages (/me/businesses -> client_pages + owned_pages). Used by all Facebook
// functions — never copy this logic between them.
export async function getFacebookPage(base44: any) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("facebook_pages");
  const headers = { Authorization: `Bearer ${accessToken}` };

  const directRes = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,access_token,fan_count,followers_count`,
    { headers, signal: AbortSignal.timeout(10000) }
  );
  const directData = await directRes.json();
  const pages = (directData.data || []).slice();

  const bizRes = await fetch(`${GRAPH}/me/businesses?fields=id,name`, {
    headers,
    signal: AbortSignal.timeout(10000),
  });
  const bizData = await bizRes.json();
  const businesses = bizData.data || [];

  for (const biz of businesses) {
    const [clientRes, ownedRes] = await Promise.all([
      fetch(`${GRAPH}/${biz.id}/client_pages?fields=id,name,access_token,fan_count,followers_count`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }),
      fetch(`${GRAPH}/${biz.id}/owned_pages?fields=id,name,access_token,fan_count,followers_count`, {
        headers,
        signal: AbortSignal.timeout(10000),
      }),
    ]);
    const clientData = await clientRes.json();
    const ownedData = await ownedRes.json();
    for (const p of [...((clientData.data || [])), ...((ownedData.data || []))]) {
      if (!pages.some((x) => String(x.id) === String(p.id))) pages.push(p);
    }
  }

  const page = pages[0];
  if (!page) {
    throw new Error("No Facebook page found. Reconnect Facebook and select your page/business during login.");
  }
  return {
    accessToken,
    pageId: String(page.id),
    pageName: String(page.name || ""),
    pageToken: String(page.access_token),
    fanCount: page.fan_count ?? null,
    followersCount: page.followers_count ?? null,
  };
}