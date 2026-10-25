import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { SERVICES, keyOf } from '@/components/observatory-v2/observatoryData';

const ALIASES = [['furniture_appliance_removal', /furniture|sofa|couch|mattress|appliance|fridge|washer/], ['moving_downsizing', /moving|downsizing/], ['property_management_turnover', /estate|property|tenant/], ['recycling_specialty_disposal', /recycl|metal|electronic/], ['renovation_construction_debris', /renovation|debris|construction/], ['commercial_office_cleanouts', /office|commercial/], ['urgent_same_day', /same.day|urgent/], ['donation_reuse_circular', /donat|reuse/]];
export default function ObservatorySearch({ locations, onCity, onCategory, category, setListOpen }) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  function search(e) {
    e.preventDefault();
    const q = keyOf(text), city = [...locations].sort((a, b) => b.name.length - a.name.length).find(c => q.includes(keyOf(c.name)));
    const service = ALIASES.find(([, re]) => re.test(q));
    if (city) onCity(city.name);
    if (service) onCategory(service[0]);
    if (!q) { setListOpen(true); setMessage('Choose a location from the city list.'); }
    else if (!city && !service) { setListOpen(true); setMessage('No matching city or service yet. Browse the monitored locations below.'); }
    else setMessage(service && !city ? 'Showing this service across Canada. Select a city for local guidance.' : `Exploring ${city.name}${service ? ' · ' + SERVICES.find(s => s[0] === service[0])[1] : ''}.`);
  }
  return (
    <div className="obs-search">
      <form onSubmit={search} className="flex items-center gap-2 border border-obs-line/60 bg-obs-surface/95 p-2 shadow-xl">
        <Search className="ml-2 size-4 shrink-0 text-obs-mint" />
        <input aria-label="Search a service or city" value={text} onChange={e => setText(e.target.value)} placeholder="Search a service or enter your city" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-obs-ink outline-none placeholder:text-obs-muted" />
        <button aria-label="Explore this service or area" className="grid size-11 shrink-0 place-items-center bg-obs-mint text-obs-bg hover:bg-obs-ink"><ArrowRight className="size-5" /></button>
      </form>
      <label className="mt-3 flex items-center gap-3 text-xs"><span className="shrink-0 text-obs-muted">Service layer</span><select value={category} onChange={e => onCategory(e.target.value)} className="min-h-11 min-w-0 flex-1 border-b border-obs-line/50 bg-obs-bg text-obs-ink outline-none">{SERVICES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {message && <p role="status" className="mt-2 text-xs text-obs-muted">{message}</p>}
    </div>
  );
}