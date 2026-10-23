import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { parseMarketCsv } from '@/lib/marketCsv';

export default function useMarketImport(onImported) {
  const cache=useQueryClient(), [file,setFile]=useState(null), [records,setRecords]=useState(null), [working,setWorking]=useState(false), [error,setError]=useState(''), [result,setResult]=useState(null);
  const [metadata,setMeta]=useState({provider:'dataforseo',source_label:'DataForSEO',source_url:'https://dataforseo.com/apis/keywords-data-api',search_engine:'google',country_code:'CA',metric_type:'monthly_volume',period:'',period_start:'',period_end:'',methodology_note:'',update_cadence:'',confirmed:false});
  const setMetadata=(v) => {setMeta(v);setRecords(null);setResult(null);};
  const choose=(v) => {setFile(v);setRecords(null);setError('');setResult(null);};
  const run=async (publish=false) => {
    setWorking(true);setError('');setResult(null);
    try {
      if(!file) throw new Error('Choose a source export first.');
      if(file.size > 2000000) throw new Error('Use a file smaller than 2 MB, with at most 500 rows.');
      let payload={metadata,preview:!publish};
      if(publish) payload.rows=records;
      else if(/\.csv$/i.test(file.name)) payload.rows=parseMarketCsv(await file.text());
      else if(/\.json$/i.test(file.name)) {const json=JSON.parse(await file.text());payload.rows=Array.isArray(json) ? json : json.rows;}
      else if(/\.xlsx?$/i.test(file.name)) {
        const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
        const {signed_url}=await base44.integrations.Core.CreateFileSignedUrl({file_uri});
        payload.signed_url=signed_url;
      } else throw new Error('Choose a template-formatted CSV, JSON rows array, or Excel file.');
      const response=await base44.functions.invoke('demandImport',payload);
      if(publish) {setResult(response.data);setRecords(null);await cache.invalidateQueries({queryKey:['marketObservatory']});await onImported?.();}
      else setRecords(response.data.records);
    } catch(e) {setError(e?.response?.data?.error || e.message);}
    finally {setWorking(false);}
  };
  return {metadata,setMetadata,file,choose,records,working,error,result,run};
}