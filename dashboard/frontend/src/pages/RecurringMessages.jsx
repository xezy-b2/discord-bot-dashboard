import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';

const UNITS = [
  { label: 'minutes', mult: 1 },
  { label: 'heures', mult: 60 },
  { label: 'jours', mult: 1440 }
];

export default function RecurringMessages() {
  const { guildId } = useParams();
  const { channels } = useGuildMeta(guildId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ channelId: '', content: '', intervalValue: 60, unit: 0 });
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
      const intervalMinutes = form.intervalValue * UNITS[form.unit].mult;
      await api.post(`/recurring-messages/${guildId}`, { channelId: form.channelId, content: form.content, intervalMinutes });
      setForm({ channelId: '', content: '', intervalValue: 60, unit: 0 });
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

  const formatInterval = (minutes) => {
    if (minutes % 1440 === 0) return `${minutes / 1440} jour(s)`;
    if (minutes % 60 === 0) return `${minutes / 60} heure(s)`;
    return `${minutes} minute(s)`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">🔁 Messages récurrents</h1>
        <p className="text-white/40 text-sm mt-1">Envoie automatiquement un message dans un salon à intervalle régulier.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}

      <div className="card p-6 mb-8 space-y-4 max-w-xl">
        <p className="label mb-0">Nouveau message récurrent</p>

        <div>
          <label className="label">Salon</label>
          <select className="input-field" value={form.channelId} onChange={e => setForm({ ...form, channelId: e.target.value })}>
            <option value="">— Choisir un salon —</option>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Message</label>
          <textarea className="input-field resize-none" rows={3} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="N'oublie pas de lire le règlement !" />
        </div>

        <div>
          <label className="label">Répéter toutes les</label>
          <div className="flex gap-2">
            <input type="number" min="1" className="input-field w-24" value={form.intervalValue} onChange={e => setForm({ ...form, intervalValue: Number(e.target.value) })} />
            <select className="input-field" value={form.unit} onChange={e => setForm({ ...form, unit: Number(e.target.value) })}>
              {UNITS.map((u, i) => <option key={i} value={i}>{u.label}</option>)}
            </select>
          </div>
          <p className="text-[11px] text-white/30 mt-1.5">Minimum 5 minutes.</p>
        </div>

        <button onClick={create} disabled={creating} className="btn-primary text-sm">{creating ? 'Création...' : 'Créer'}</button>
      </div>

      {!loading && messages.length === 0 && <p className="text-white/30 text-sm">Aucun message récurrent configuré.</p>}

      <div className="space-y-3 max-w-xl">
        {messages.map(m => (
          <div key={m._id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-white/50">#{channels.find(c => c.id === m.channelId)?.name || '?'} · toutes les {formatInterval(m.intervalMinutes)}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{m.content}</p>
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
