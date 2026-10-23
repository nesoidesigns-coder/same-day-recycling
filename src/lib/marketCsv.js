export function parseMarketCsv(text) {
  const source = text.replace(/^\uFEFF/,'');
  const first = source.split(/\r?\n/)[0] || '';
  const separator = first.includes('\t') ? '\t' : first.includes(';') && !first.includes(',') ? ';' : ',';
  const grid = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') { if (quoted && source[i+1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === separator || c === '\n')) { row.push(cell); cell=''; if(c === '\n') {if(row.some((x) => x.trim())) grid.push(row);row=[];} }
    else if (c !== '\r' || quoted) cell += c;
  }
  if(quoted) throw new Error('Unclosed quotation mark in CSV.');
  row.push(cell); if(row.some((x) => x.trim())) grid.push(row);
  const headers = (grid.shift() || []).map((s) => s.trim().toLowerCase().replaceAll(' ','_'));
  if(!headers.includes('keyword') || new Set(headers).size !== headers.length) throw new Error('Use the template headers, including keyword. Duplicate headers are not allowed.');
  if(grid.length > 500 || !grid.length) throw new Error('Import 1–500 rows per file.');
  return grid.map((cells,i) => {if(cells.length !== headers.length) throw new Error(`CSV row ${i+2} has the wrong number of columns.`); return Object.fromEntries(headers.map((h,j) => [h,cells[j].trim()]));});
}
export function downloadMarketTemplate() {
  const headers = ['keyword','service_category','country_code','search_engine','geo_type','province','city','period','metric_type','est_monthly_volume','estimated_clicks','trend_index','comparison_group','period_start','period_end','close_variants'];
  const url = URL.createObjectURL(new Blob([headers.join(',')+'\n'], {type:'text/csv'}));
  const a = document.createElement('a'); a.href=url; a.download='canadian-market-observations.csv'; a.click(); URL.revokeObjectURL(url);
}