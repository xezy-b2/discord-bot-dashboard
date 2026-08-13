import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';

const PLATFORMS = [
  { value: 'twitch', label: '🟣 Twitch', placeholder: 'pseudo_twitch', help: 'Le pseudo exact de la chaîne (visible dans l\'URL twitch.tv/pseudo). Nécessite TWITCH_CLIENT_ID/SECRET dans le .env du bot.', defaultColor: '#9146FF' },
  { value: 'youtube', label: '🔴 YouTube', placeholder: 'UCxxxxxxxxxxxxxxxxxxxxxx', help: 'L\'ID de chaîne YouTube (pas le nom) — visible dans Paramètres avancés de la chaîne. Nécessite YOUTUBE_API_KEY.', defaultColor: '#FF0000' },
  { value: 'tiktok', label: '⚫ TikTok', placeholder: 'pseudo_tiktok', help: 'Fonctionnement best-effort (pas d\'API officielle) : TikTok peut casser cette fonctionnalité sans préavis.', defaultColor: '#000000' },
  { value: 'epicgames', label: '⬛ Epic Games (jeux gratuits)', placeholder: 'global', help: 'Alerte quand de nouveaux jeux gratuits apparaissent sur l\'Epic Games Store. Mets n\'importe quel identifiant, ex: "global".', defaultColor: '#313131' },
  { value: 'steam', label: '🔵 Steam (jeux gratuits)', placeholder: 'global', help: 'Alerte quand un jeu passe à -100% (gratuit temporairement) sur le Steam Store. Mets n\'importe quel identifiant, ex: "global".', defaultColor: '#1b2838' }
];

export default function SocialNotifications() {
  const { guildId } = useParams();
  const { channels } = useGuildMeta(guildId);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ platform: 'twitch', identifier: '', displayName: '', channelId: '', message: '', embedColor: '#9146FF' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const currentPlatform = PLATFORMS.find(p => p.value === form.platform);
  const isGlobalPlatform = form.platform === 'epicgames' || form.platform === 'steam';

  const selectPlatform = (value) => {
    const platform = PLATFORMS.find(p => p.value === value);
    setForm({ ...form, platform: value, embedColor: platform.defaultColor });
  };

  const load = () => {
    setLoading(true);
    api.get(`/social-notifications/${guildId}`).then(res => setAccounts(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [guildId]);

  const create = async () => {
    if ((!isGlobalPlatform && !form.identifier.trim()) || !form.channelId) return;
    setCreating(true);
    setError('');
    try {
      await api.post(`/social-notifications/${guildId}`, form);
      setForm({ platform: form.platform, identifier: '', displayName: '', channelId: '', message: '', embedColor: currentPlatform.defaultColor });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout');
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (id, enabled) => {
    await api.patch(`/social-notifications/${guildId}/${id}`, { enabled });
    load();
  };

  const updateColor = async (id, embedColor) => {
    setAccounts(accounts.map(a => a._id === id ? { ...a, embedColor } : a));
    await api.patch(`/social-notifications/${guildId}/${id}`, { embedColor });
  };

  const remove = async (id) => {
    await api.delete(`/social-notifications/${guildId}/${id}`);
    load();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">📡 Notifications sociales</h1>
        <p className="text-white/40 text-sm mt-1">Alerte automatiquement le serveur quand un compte suivi publie du contenu.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}

      <div className="card p-6 mb-8 space-y-4 max-w-xl">
        <p className="label mb-0">Ajouter un compte à suivre</p>

        <div>
          <label className="label">Plateforme</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.value}
                onClick={() => selectPlatform(p.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${form.platform === p.value ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/30 mt-2">{currentPlatform.help}</p>
        </div>

        {!isGlobalPlatform && (
          <>
            <div>
              <label className="label">Identifiant</label>
              <input className="input-field" placeholder={currentPlatform.placeholder} value={form.identifier} onChange={e => setForm({ ...form, identifier: e.target.value })} />
            </div>

            <div>
              <label className="label">Nom affiché (optionnel)</label>
              <input className="input-field" placeholder={form.identifier || '...'} value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
            </div>
          </>
        )}

        <div>
          <label className="label">Salon de notification</label>
          <select className="input-field" value={form.channelId} onChange={e => setForm({ ...form, channelId: e.target.value })}>
            <option value="">— Choisir un salon —</option>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Message custom (optionnel, s'ajoute avant l'embed)</label>
          <input className="input-field" placeholder="@everyone" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        </div>

        <div>
          <label className="label">Couleur de l'embed</label>
          <div className="flex items-center gap-2 bg-base-850 border border-white/10 rounded-xl px-2 py-1.5 w-fit">
            <input type="color" value={form.embedColor} onChange={e => setForm({ ...form, embedColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer bg-transparent" />
            <span className="text-xs text-white/50 font-mono">{form.embedColor}</span>
          </div>
        </div>

        <button onClick={create} disabled={creating} className="btn-primary text-sm">{creating ? 'Ajout...' : 'Ajouter'}</button>
      </div>

      {!loading && accounts.length === 0 && <p className="text-white/30 text-sm">Aucun compte suivi pour le moment.</p>}

      <div className="space-y-3 max-w-xl">
        {accounts.map(a => (
          <div key={a._id} className="card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {PLATFORMS.find(p => p.value === a.platform)?.label}
                {a.platform !== 'epicgames' && a.platform !== 'steam' && ` — ${a.displayName || a.identifier}`}
              </p>
              <p className="text-xs text-white/40">#{channels.find(c => c.id === a.channelId)?.name || '?'}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <input
                type="color"
                value={a.embedColor || '#5865F2'}
                onChange={e => updateColor(a._id, e.target.value)}
                title="Couleur de l'embed"
                className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/10"
              />
              <Toggle checked={a.enabled} onChange={v => toggle(a._id, v)} />
              <button onClick={() => remove(a._id)} className="text-xs text-red-400 hover:text-red-300">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
