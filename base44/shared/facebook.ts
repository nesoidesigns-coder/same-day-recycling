const GRAPH = "https://graph.facebook.com/v25.0";

// Gets the connected Facebook user token and the first managed Page's token.
// Used by all Facebook functions — never copy this logic between them.
export async function getFacebookPage(base44: any) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("facebook_pages");
  const res = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,access_token,fan_count,followers_count`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    }
  );
  const data = await res.json();
  const page = (data.data || [])[0];
  if (!page) {
    throw new Error("No Facebook page connected. Reconnect Facebook in the app integrations.");
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