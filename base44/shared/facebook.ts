const GRAPH = "https://graph.facebook.com/v25.0";

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