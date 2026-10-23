import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeDemandRows, observationKey } from '../../shared/marketImport.ts';
import { buildMarketCommand } from '../../shared/marketCommand.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({error:'Unauthorized'},{status:401});
    if (user.role !== 'admin') return Response.json({error:'Forbidden'},{status:403});
    const text = await req.text();
    if (text.length > 2000000) return Response.json({error:'Import payload exceeds 2 MB.'},{status:413});
    const payload = JSON.parse(text), meta = payload.metadata || {};
    let rows = payload.rows;
    // Excel remains available as a reviewed extraction; CSV/JSON uses deterministic parsing in the browser.
    if (!rows && payload.signed_url && payload.preview === true) {
      const url = new URL(payload.signed_url);
      if (!['media.base44.com','static.wixstatic.com','base44.app'].some((host) => url.hostname === host || url.hostname.endsWith('.'+host)) || url.protocol !== 'https:') return Response.json({error:'Use the app private-upload file picker.'},{status:400});
      const extracted = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({file_url:payload.signed_url,json_schema:{type:'object',properties:{rows:{type:'array',maxItems:500,items:{type:'object',properties:{keyword:{type:'string'},service_category:{type:'string'},country_code:{type:'string'},search_engine:{type:'string'},geo_type:{type:'string'},province:{type:'string'},city:{type:'string'},period:{type:'string'},metric_type:{type:'string'},est_monthly_volume:{type:'number'},estimated_clicks:{type:'number'},trend_index:{type:'number'},comparison_group:{type:'string'},period_start:{type:'string'},period_end:{type:'string'},close_variants:{type:'string'}},required:['keyword']}}},required:['rows']}});
      if (extracted.status !== 'success') return Response.json({error:extracted.details || 'Could not extract spreadsheet rows.'},{status:400});
      rows = extracted.output?.rows;
    }
    let records;
    try { records = normalizeDemandRows(rows,meta); } catch(e) { return Response.json({error:e.message},{status:400}); }
    if (payload.preview === true) return Response.json({ok:true,records,count:records.length,review_required:true,command_preview:buildMarketCommand(records,{engine:meta.search_engine || 'google',measure:meta.metric_type === 'monthly_average' ? 'monthly_average' : 'monthly_volume'})});
    let cursor; const existing = new Map();
    do {
      const page = await base44.entities.DemandObservation.filter({provider:meta.provider,source:meta.source_label,period:{$in:[...new Set(records.map((r) => r.period))]}},{limit:500,cursor});
      for(const r of page.items || []) existing.set(observationKey(r),r.id);
      cursor = page.has_more ? page.next_cursor : undefined;
    } while(cursor);
    const creates=[], updates=[];
    for(const record of records) {const id=existing.get(observationKey(record));if(id) updates.push({id,...record});else creates.push(record);}
    for(let i=0;i<creates.length;i+=100) await base44.entities.DemandObservation.bulkCreate(creates.slice(i,i+100));
    for(let i=0;i<updates.length;i+=100) await base44.entities.DemandObservation.bulkUpdate(updates.slice(i,i+100));
    await base44.entities.DemandSyncLog.create({source:'import',status:'success',run_date:new Date().toISOString().slice(0,10),finished_at:new Date().toISOString(),records_upserted:records.length,period:[...new Set(records.map((r) => r.period))].sort().join(', ').slice(0,500),coverage_note:`${meta.source_label}: ${records.length} source observations imported. Provider ${meta.provider}; engines and measures stored separately.`,next_update_cadence:meta.update_cadence});
    return Response.json({ok:true,created:creates.length,updated:updates.length,total:records.length});
  } catch(error) { return Response.json({error:error.message},{status:500}); }
}