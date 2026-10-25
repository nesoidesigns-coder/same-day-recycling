// TEMPORARY diagnostic — mobile layout audit. Opens live pages in a real
// browser at a 411px viewport, measures horizontal overflow and captures
// screenshots. Deleted after the layout fix is verified.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.57";
import { Stagehand } from "npm:@browserbasehq/stagehand@3.7.3";

const PAGES = ["/", "/service-finder", "/request-service", "/request-status", "/track", "/services", "/move-assist"];

const OVERFLOW_JS = () => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1 || r.right > vw + 1 || r.left < -1) {
      const cls = typeof el.className === "string" ? el.className.slice(0, 90) : "";
      let chain = [];
      let a = el;
      for (let i = 0; i < 4 && a && a !== document.body; i++) {
        chain.push(a.tagName.toLowerCase() + "." + (typeof a.className === "string" ? a.className.slice(0, 60) : ""));
        a = a.parentElement;
      }
      const cs = getComputedStyle(el);
      bad.push({ tag: el.tagName.toLowerCase(), cls, width: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right), minW: cs.minWidth, ws: cs.whiteSpace, chain });
    }
  });
  return { viewport: vw, scrollWidth: document.documentElement.scrollWidth, overflowing: bad.slice(0, 12) };
};

export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const paths = body.path ? [body.path] : PAGES;
  const base = "https://light-clear-today-haul.base44.app";
  const session = await base44.asServiceRole.browser.getSession({ sessionTimeoutSeconds: 180 });
  let stagehand;
  const results = [];
  const debug_screenshots = [];
  try {
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
    stagehand = new Stagehand({
      env: "LOCAL",
      localBrowserLaunchOptions: { cdpUrl: session.connectionUrl, viewport: { width: 411, height: 823 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      model: { modelName: "openai/gpt_6_luna", apiKey: token, baseURL, headers, openaiEndpointFormat: "chat" },
      disablePino: true,
    });
    await stagehand.init();
    const page = stagehand.context.pages()[0];

    for (const p of paths) {
      try {
        await page.goto(base + p, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(3500);
        const audit = await page.evaluate(OVERFLOW_JS);
        results.push({ path: p, viewport: audit.viewport, scrollWidth: audit.scrollWidth, overflowing: audit.overflowing.slice(0, 6).map((o) => ({ tag: o.tag, cls: o.cls, width: o.width, right: o.right, ws: o.ws, parent: o.chain[1] || "" })) });
      } catch (e) {
        results.push({ path: p, error: String(e).slice(0, 200) });
      }
    }
  } finally {
    await stagehand?.close().catch(() => {});
    await session.end();
  }
  return Response.json({ results, debug_screenshots });
}