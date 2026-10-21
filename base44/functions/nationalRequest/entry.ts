import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { submitNationalInquiry } from '../../shared/nationalInquiry.ts';

// Public nationwide inquiry endpoint. Accepts requests from every Canadian
// province, territory and municipality — see shared/nationalInquiry.ts.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'nationalRequest', 20);
    if (!limited.allowed) return rateLimitedResponse();

    const body = await req.json();
    const result = await submitNationalInquiry(base44, body);
    if (!result.ok) return Response.json({ error: result.error }, { status: 422 });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}