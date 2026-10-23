import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { currentPeriod } from '../../shared/demand.ts';

// Search-result summaries cannot verify a Trends index. Only source exports
// with their original normalization windows enter the market observation store.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req), user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({error:'Forbidden'},{status:403});
    return Response.json({ok:false,status:'unavailable',period:currentPeriod(),records_upserted:0,results:[],retrieval_note:'No authenticated Google Trends data feed is connected. Import a Google Trends Canada export with reporting months and its original comparison window. Web-search summaries are not verified index readings; no values were generated or stored.'});
  } catch(error) { return Response.json({error:error.message},{status:500}); }
}