const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const roadWords = new Set(['street', 'st', 'avenue', 'ave', 'av', 'road', 'rd', 'drive', 'dr', 'boulevard', 'blvd', 'boul', 'crescent', 'cres', 'way', 'court', 'ct', 'place', 'pl', 'lane', 'ln', 'rue', 'chemin', 'ch', 'route', 'highway', 'hwy']);
const directions = new Set(['north', 'south', 'east', 'west', 'n', 's', 'e', 'w', 'nord', 'sud', 'est', 'ouest']);
export function matchCanadianAddresses(raw, query) {
  const normalizedQuery = normalize(query);
  const words = new Set(normalizedQuery.split(' '));
  const house = String(query).match(/^\s*(\d+[a-z]?)\b/i)?.[1]?.toLowerCase() || '';
  // An explicit trailing municipality is a constraint, not a ranking hint.
  let cityHint = String(query).split(',').map((p) => p.trim())[1] || '';
  if (!cityHint) cityHint = query.match(/\b(?:street|st\.?|avenue|ave\.?|road|rd\.?|drive|dr\.?|boulevard|blvd\.?|crescent|lane|way|court|place)\s+(?:(?:north|south|east|west|n|s|e|w)\s+)?(.+)$/i)?.[1] || '';
  cityHint = normalize(cityHint).replace(/\b(?:canada|bc|ab|sk|mb|on|qc|ns|nb|pe|nl|yt|nt|nu|british columbia|ontario|alberta|quebec|manitoba|saskatchewan)\b.*$/, '').replace(/\b[a-z]\d[a-z].*$/, '').trim();
  const seen = new Set();
  let matches = raw.filter((c) => {
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng) || c.lat < 41 || c.lat > 84 || c.lng < -142 || c.lng > -52 || !c.city || !c.province || !c.street) return false;
    const streetWords = normalize(c.street).split(' ').filter((w) => !roadWords.has(w) && !directions.has(w));
    if (!streetWords.length || !streetWords.every((w) => words.has(w))) return false;
    const city = normalize(c.city);
    if (cityHint && city !== cityHint && !city.endsWith(` ${cityHint}`) && !cityHint.endsWith(` ${city}`)) return false;
    const key = `${normalize(c.label)}:${c.lat.toFixed(5)}:${c.lng.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  const exact = house ? matches.filter((c) => normalize(c.house_number) === house) : [];
  if (exact.length) matches = exact;
  matches.sort((a, b) => Number(normalizedQuery.includes(normalize(b.city))) - Number(normalizedQuery.includes(normalize(a.city))));
  return matches.slice(0, 5).map((c) => {
    const precise = !!house && normalize(c.house_number) === house;
    return { ...c, label: precise ? c.label : c.street, postal_code: precise ? c.postal_code : '', house_number: precise ? c.house_number : '', street_level: !precise, confidence: precise ? 'address' : 'street',
      confidence_basis: precise ? 'Provider house number, street and municipality match' : 'Street coordinate only; customer pin confirmation required', entered_address: query.split(',')[0].split(new RegExp(c.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))[0].trim() };
  });
}