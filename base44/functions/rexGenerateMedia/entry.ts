import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const VOICES = ['river', 'honey', 'sunny', 'storm', 'spark'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload = {};
    try { payload = await req.json(); } catch {}

    const kind = payload.kind === 'video' ? 'video' : 'audio';

    if (kind === 'video') {
      // Video generation is for the owner (marketing content) - admin only
      let role = null;
      try {
        const user = await base44.auth.me();
        role = user ? user.role : null;
      } catch {}
      if (role !== 'admin') {
        return Response.json({ error: 'Video generation is available to the site owner only. Audio is available to everyone.' }, { status: 403 });
      }
      const prompt = String(payload.prompt || '').trim().slice(0, 800);
      if (!prompt) return Response.json({ error: 'prompt is required for video' }, { status: 400 });
      const result = await base44.asServiceRole.integrations.Core.GenerateVideo({
        prompt,
        duration: 6,
        generate_audio: true,
      });
      return Response.json({ kind: 'video', url: result.url });
    }

    // Audio (text-to-speech) is available to everyone, bounded
    const text = String(payload.text || '').trim().slice(0, 2000);
    if (!text) return Response.json({ error: 'text is required for audio' }, { status: 400 });
    const voice = VOICES.includes(payload.voice) ? payload.voice : undefined;
    const result = voice
      ? await base44.asServiceRole.integrations.Core.GenerateSpeech({ text, voice })
      : await base44.asServiceRole.integrations.Core.GenerateSpeech({ text });
    return Response.json({ kind: 'audio', url: result.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}