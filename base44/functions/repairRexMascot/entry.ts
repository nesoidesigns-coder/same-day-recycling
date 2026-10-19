import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import OpenAI from 'npm:openai@6.45.0';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    if (body.action !== 'restoreRex') return Response.json({ error: 'Invalid action' }, { status: 400 });
    const { baseURL, token, headers } = base44.asServiceRole.aiGateway.connection();
    const client = new OpenAI({ baseURL, apiKey: token, defaultHeaders: headers, maxRetries: 0, timeout: 240000 });
    const result = await client.images.generate({
      model: 'automatic',
      n: 1,
      resolution: '1K',
      aspect_ratio: '2:3',
      quality: 'high',
      output_format: 'png',
      background: 'transparent',
      response_format: 'url',
      reference_image_urls: ['https://base44.app/api/apps/6ac93990cde830898b8dbc65/files/mp/public/6ac93990cde830898b8dbc65/42c29740d_rex-crop.png'],
      prompt: 'Restore the supplied damaged Human Rex mascot into a pristine smooth high-resolution 3D vinyl toy render. Preserve the same character identity, friendly human male recycling worker, proportions, green baseball cap, short brown hair, warm natural peach skin, orange high-visibility safety vest with silver reflective strips, white short sleeve shirt, dark blue cuffed work jeans and brown work boots. Preserve the relaxed front-facing standing pose, his right hand raised in a small welcoming wave on the left of the image, and a small black grabber tool held naturally down by his other hand. Full body entirely visible from cap to boot soles, centered, modest empty margin. Repair all vertical striping, pixel corruption and color spill. Crisp antialiased silhouette with natural soft studio illumination. Produce a genuine RGBA transparent-background PNG cutout: every pixel outside his silhouette must be transparent, including spaces between fingers, legs and the tool. No white rectangle, no magenta background, no green spill, no painted checkerboard, no text, no border, no backdrop, no floor, no external cast shadow or glow. Only the restored original character, not a redesigned mascot.'
    });
    if (!result.data?.[0]?.url) throw new Error('No restored image returned');
    return Response.json({ url: result.data[0].url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}