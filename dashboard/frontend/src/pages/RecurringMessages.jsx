import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';

const INTERVAL_PRESETS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 heure', value: 60 },
  { label: '2 heures', value: 120 },
  { label: '3 heures', value: 180 },
  { label: '6 heures', value: 360 },
  { label: '12 heures', value: 720 },
  { label: '24 heures', value: 1440 }
];

const DAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

function HourRangeSlider({ start, end, onChange }) {
  return (
    <div className="pt-2 pb-1">
      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full bg-white/10" />
        <div
          className="absolute h-1.5 rounded-full bg-signal-500 top-0"
          style={{ left: `${(start / 24) * 100}%`, right: `${100 - (end / 24) * 100}%` }}
        />
        <input
          type="range" min="0" max="24" value={start}
          onChange={e => onChange(Math.min(Number(e.target.value), end), end)}
          className="range-thumb-only absolute top-0 left-0 w-full h-1.5"
        />
        <input
          type="range" min="0" max="24" value={end}
          onChange={e => onChange(start, Math.max(Number(e.target.value), start))}
          className="range-thumb-only absolute top-0 left-0 w-full h-1.5"
        />
      </div>
      <div className="flex justify-between text-xs text-white/50 mt-3">
        <span>{String(start).padStart(2, '0')}:00</span>
        <span>{String(end).padStart(2, '0')}:00</span>
      </div>
    </div>
  );
}

function DaysPicker({ value, onChange }) {
  const toggle = (dayIndex) => {
    onChange(value.includes(dayIndex) ? value.filter(d => d !== dayIndex) : [...value, dayIndex].sort());
  };
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((label, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition ${value.includes(i) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const emptyForm = () => ({
  name: '',
  channelId: '',
  content: '',
  mode: 'interval',
  intervalMinutes: 60,
  targetHour: 9,
  targetMinute: 0,
  sendHourStart: 0,
  sendHourEnd: 24,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
});

export default function RecurringMessages() {
  const { guildId } = useParams();
  const { channels } = useGuildMeta(guildId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/recurring-messages/${guildId}`).then(res => setMessages(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [guildId]);

  const create = async () => {
    if (!form.channelId || !form.content.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.post(`/recurring-messages/${guildId}`, form);
      setForm(emptyForm());
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (id, enabled) => {
    await api.patch(`/recurring-messages/${guildId}/${id}`, { enabled });
    load();
  };

  const remove = async (id) => {
    await api.delete(`/recurring-messages/${guildId}/${id}`);
    load();
  };

  const summarize = (m) => {
    const days = m.daysOfWeek?.length === 7 ? 'tous les jours' : m.daysOfWeek.map(d => DAYS[d]).join(', ');
    const range = (m.sendHourStart === 0 && m.sendHourEnd === 24) ? '' : ` entre ${String(m.sendHourStart).padStart(2, '0')}h et ${String(m.sendHourEnd).padStart(2, '0')}h`;
    const timing = m.mode === 'targetTime'
      ? `à ${String(m.targetHour).padStart(2, '0')}:${String(m.targetMinute).padStart(2, '0')}`
      : `toutes les ${INTERVAL_PRESETS.find(p => p.value === m.intervalMinutes)?.label || `${m.intervalMinutes} min`}`;
    return `${timing} · ${days}${range}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">🔁 Messages récurrents</h1>
        <p className="text-white/40 text-sm mt-1">Envoie automatiquement un message dans un salon, selon un planning personnalisable.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}

      <div className="card p-6 mb-8 space-y-5 max-w-3xl">
        <p className="label mb-0">Créer un message récurrent</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center justify-between">
              <span>Nom du message récurrent</span>
              <span className="text-white/30 normal-case">{form.name.length}/30</span>
            </label>
            <input
              className="input-field" placeholder="Rappel Twitch" maxLength={30}
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Salon du message récurrent</label>
            <select className="input-field" value={form.channelId} onChange={e => setForm({ ...form, channelId: e.target.value })}>
              <option value="">Veuillez sélectionner un salon</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Message</label>
          <textarea className="input-field resize-none" rows={3} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="N'oublie pas de lire le règlement !" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Intervalle d'envoi</label>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {['interval', 'targetTime'].map(m => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, mode: m })}
                  className={`flex-1 py-2.5 text-sm font-medium transition ${form.mode === m ? 'bg-signal-500 text-white' : 'bg-base-850 text-white/40 hover:bg-white/5'}`}
                >
                  {m === 'interval' ? 'Répétition' : 'Heure ciblée'}
                </button>
              ))}
            </div>

            {form.mode === 'interval' ? (
              <select className="input-field mt-3" value={form.intervalMinutes} onChange={e => setForm({ ...form, intervalMinutes: Number(e.target.value) })}>
                {INTERVAL_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            ) : (
              <input
                type="time"
                className="input-field mt-3"
                value={`${String(form.targetHour).padStart(2, '0')}:${String(form.targetMinute).padStart(2, '0')}`}
                onChange={e => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  setForm({ ...form, targetHour: h, targetMinute: m });
                }}
              />
            )}
            {form.mode === 'targetTime' && <p className="text-[11px] text-white/30 mt-1.5">Heure exprimée en UTC.</p>}
          </div>

          <div>
            <label className="label">Plage horaire d'envoi (UTC)</label>
            <div className="input-field !py-3">
              <HourRangeSlider
                start={form.sendHourStart}
                end={form.sendHourEnd}
                onChange={(s, e) => setForm({ ...form, sendHourStart: s, sendHourEnd: e })}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Jours d'envoi</label>
          <DaysPicker value={form.daysOfWeek} onChange={v => setForm({ ...form, daysOfWeek: v })} />
        </div>

        <button onClick={create} disabled={creating} className="btn-primary text-sm">{creating ? 'Création...' : 'Créer'}</button>
      </div>

      {!loading && messages.length === 0 && <p className="text-white/30 text-sm">Aucun message récurrent configuré.</p>}

      <div className="space-y-3 max-w-3xl">
        {messages.map(m => (
          <div key={m._id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.name || '(sans nom)'}</p>
                <p className="text-xs text-white/40 mt-0.5">#{channels.find(c => c.id === m.channelId)?.name || '?'} · {summarize(m)}</p>
                <p className="text-sm mt-1.5 whitespace-pre-wrap">{m.content}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={m.enabled} onChange={v => toggle(m._id, v)} />
                <button onClick={() => remove(m._id)} className="text-xs text-red-400 hover:text-red-300">Supprimer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
