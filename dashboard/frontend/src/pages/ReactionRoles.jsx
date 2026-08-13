import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';

const BUTTON_COLORS = [
  { value: 'gray', label: 'Gris (par défaut)' },
  { value: 'blurple', label: 'Bleu' },
  { value: 'green', label: 'Vert' },
  { value: 'red', label: 'Rouge' }
];

const emptyEntry = () => ({ emoji: '', label: '', roleId: '', buttonColor: 'gray' });

export default function ReactionRoles() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    channelId: '',
    componentType: 'reaction',
    mode: 'multi',
    title: '',
    description: '',
    color: '#5865F2'
  });
  const [draftEntries, setDraftEntries] = useState([emptyEntry()]);

  const [pairForms, setPairForms] = useState({}); // messageId -> nouvelle entree a ajouter apres coup

  const load = () => {
    setLoading(true);
    api.get(`/reaction-roles/${guildId}`).then(res => setEntries(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [guildId]);

  const updateDraftEntry = (index, patch) => {
    setDraftEntries(prev => prev.map((e, i) => i === index ? { ...e, ...patch } : e));
  };

  const addDraftEntry = () => setDraftEntries(prev => [...prev, emptyEntry()]);
  const removeDraftEntry = (index) => setDraftEntries(prev => prev.filter((_, i) => i !== index));

  const create = async () => {
    if (!form.channelId || !form.title.trim()) return;
    const cleanEntries = draftEntries.filter(e => e.roleId && (form.componentType === 'reaction' ? e.emoji : true));
    if (form.componentType !== 'reaction' && cleanEntries.length === 0) {
      setError('Ajoute au moins une entrée valide (rôle requis) avant de publier.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const res = await api.post(`/reaction-roles/${guildId}/create`, { ...form, entries: cleanEntries });
      setEntries(res.data);
      setForm({ channelId: '', componentType: 'reaction', mode: 'multi', title: '', description: '', color: '#5865F2' });
      setDraftEntries([emptyEntry()]);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const addPair = async (messageId) => {
    const pairForm = pairForms[messageId];
    if (!pairForm?.roleId) return;
    setError('');
    try {
      await api.post(`/reaction-roles/${guildId}/${messageId}/pairs`, pairForm);
      setPairForms({ ...pairForms, [messageId]: emptyEntry() });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout');
    }
  };

  const removePair = async (messageId, key) => {
    await api.delete(`/reaction-roles/${guildId}/${messageId}/pairs/${encodeURIComponent(key)}`);
    load();
  };

  const removeEntry = async (messageId) => {
    await api.delete(`/reaction-roles/${guildId}/${messageId}`);
    load();
  };

  const typeLabel = { reaction: '😀 Réactions', button: '🔘 Boutons', select: '📋 Menu déroulant' };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">🎭 Rôles à réaction</h1>
        <p className="text-white/40 text-sm mt-1">
          Crée un panneau (réactions, boutons ou menu déroulant) pour que les membres s'attribuent des rôles eux-mêmes.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* --- Formulaire de création --- */}
      <div className="card p-6 mb-8 space-y-5 max-w-2xl">
        <p className="label mb-0">Nouveau panneau</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Salon de publication</label>
            <select className="input-field" value={form.channelId} onChange={e => setForm({ ...form, channelId: e.target.value })}>
              <option value="">— Choisir —</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mode</label>
            <select className="input-field" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
              <option value="multi">Multi (plusieurs rôles cumulables)</option>
              <option value="unique">Unique (un seul rôle à la fois)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Type de composant</label>
          <div className="flex gap-2">
            {Object.entries(typeLabel).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setForm({ ...form, componentType: key })}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${form.componentType === key ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Titre</label>
          <input className="input-field" placeholder="Choisis tes rôles" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Clique sur les boutons pour obtenir les rôles" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="flex items-center gap-2 bg-base-850 border border-white/10 rounded-xl px-2 py-1.5 w-fit">
          <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-7 h-7 rounded cursor-pointer bg-transparent" />
          <span className="text-xs text-white/50 font-mono">{form.color}</span>
        </div>

        {/* --- Entrées (emoji + label + rôle [+ couleur]) --- */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <p className="label mb-0">Entrées {form.componentType === 'reaction' ? '(emoji + rôle)' : '(emoji + label + rôle)'}</p>

          {draftEntries.map((entry, i) => (
            <div key={i} className="flex gap-2 items-center flex-wrap bg-white/5 rounded-xl p-3">
              <input
                className="input-field w-20 text-center"
                placeholder="😀"
                value={entry.emoji}
                onChange={e => updateDraftEntry(i, { emoji: e.target.value })}
              />
              {form.componentType !== 'reaction' && (
                <input
                  className="input-field flex-1 min-w-[120px]"
                  placeholder="Label du bouton/option"
                  value={entry.label}
                  onChange={e => updateDraftEntry(i, { label: e.target.value })}
                />
              )}
              <select
                className="input-field flex-1 min-w-[140px]"
                value={entry.roleId}
                onChange={e => {
                  const role = roles.find(r => r.id === e.target.value);
                  updateDraftEntry(i, { roleId: e.target.value, label: entry.label || role?.name || '' });
                }}
              >
                <option value="">— Rôle —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {form.componentType === 'button' && (
                <select
                  className="input-field w-40"
                  value={entry.buttonColor}
                  onChange={e => updateDraftEntry(i, { buttonColor: e.target.value })}
                >
                  {BUTTON_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              )}
              <button onClick={() => removeDraftEntry(i)} className="text-red-400 hover:text-red-300 text-sm shrink-0">Supprimer</button>
            </div>
          ))}

          <button onClick={addDraftEntry} className="btn-ghost text-sm">+ Ajouter une entrée</button>
        </div>

        <button onClick={create} disabled={creating} className="btn-primary text-sm">
          {creating ? 'Création...' : 'Publier le panneau'}
        </button>
      </div>

      {/* --- Panneaux existants --- */}
      {!loading && entries.length === 0 && (
        <p className="text-white/30 text-sm">Aucun panneau pour le moment.</p>
      )}

      <div className="space-y-4 max-w-2xl">
        {entries.map(entry => (
          <div key={entry.messageId} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">{entry.title}</p>
                <p className="text-xs text-white/40">
                  {typeLabel[entry.componentType]} · {entry.mode === 'unique' ? 'Unique' : 'Multi'} · #{channels.find(c => c.id === entry.channelId)?.name || '?'}
                </p>
              </div>
              <button onClick={() => removeEntry(entry.messageId)} className="text-xs text-red-400 hover:text-red-300">Supprimer</button>
            </div>

            <div className="space-y-2 mb-3">
              {entry.pairs.map(p => (
                <div key={p.roleId} className="flex items-center justify-between text-sm bg-white/5 px-3 py-2 rounded-lg">
                  <span>{p.emoji} {p.label && `${p.label} — `}{roles.find(r => r.id === p.roleId)?.name || p.roleId}</span>
                  <button onClick={() => removePair(entry.messageId, entry.componentType === 'reaction' ? p.emoji : p.roleId)} className="text-white/40 hover:text-red-400">✕</button>
                </div>
              ))}
              {entry.pairs.length === 0 && <p className="text-white/30 text-xs">Aucune entrée pour l'instant.</p>}
            </div>

            <div className="flex gap-2 flex-wrap">
              <input
                className="input-field w-20 text-center"
                placeholder="😀"
                value={pairForms[entry.messageId]?.emoji || ''}
                onChange={e => setPairForms({ ...pairForms, [entry.messageId]: { ...(pairForms[entry.messageId] || emptyEntry()), emoji: e.target.value } })}
              />
              {entry.componentType !== 'reaction' && (
                <input
                  className="input-field flex-1 min-w-[100px]"
                  placeholder="Label"
                  value={pairForms[entry.messageId]?.label || ''}
                  onChange={e => setPairForms({ ...pairForms, [entry.messageId]: { ...(pairForms[entry.messageId] || emptyEntry()), label: e.target.value } })}
                />
              )}
              <select
                className="input-field flex-1 min-w-[120px]"
                value={pairForms[entry.messageId]?.roleId || ''}
                onChange={e => setPairForms({ ...pairForms, [entry.messageId]: { ...(pairForms[entry.messageId] || emptyEntry()), roleId: e.target.value } })}
              >
                <option value="">— Rôle —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button onClick={() => addPair(entry.messageId)} className="btn-ghost text-sm shrink-0">Ajouter</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
