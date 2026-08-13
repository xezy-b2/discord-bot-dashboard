import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Toggle from '../components/Toggle';

export default function Automod() {
  const { guildId } = useParams();
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wordInput, setWordInput] = useState('');

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(res.data.automod));
  }, [guildId]);

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    await api.patch(`/config/${guildId}/automod`, cfg);
    setSaving(false);
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🛡️ Auto-modération</h1>
          <p className="text-white/40 text-sm mt-1">Protège ton serveur automatiquement.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="card p-6">
          <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer l'auto-modération" />
        </div>

        <div className="card p-6 space-y-4">
          <Toggle checked={cfg.antiInvite} onChange={v => update({ antiInvite: v })} label="Bloquer les liens d'invitation Discord" />
          <Toggle checked={cfg.antiLink} onChange={v => update({ antiLink: v })} label="Bloquer tous les liens externes" />
          <Toggle checked={cfg.antiSpam} onChange={v => update({ antiSpam: v })} label="Anti-spam (messages répétés rapidement)" />

          {cfg.antiSpam && (
            <div className="grid grid-cols-2 gap-4 pl-1">
              <div>
                <label className="label">Seuil (messages)</label>
                <input type="number" className="input-field" value={cfg.spamThreshold} onChange={e => update({ spamThreshold: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Intervalle (ms)</label>
                <input type="number" className="input-field" value={cfg.spamIntervalMs} onChange={e => update({ spamIntervalMs: Number(e.target.value) })} />
              </div>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-3">
          <label className="label">Pourcentage de MAJUSCULES max (0 = désactivé)</label>
          <input type="number" className="input-field" value={cfg.antiCapsPercent} onChange={e => update({ antiCapsPercent: Number(e.target.value) })} />
        </div>

        <div className="card p-6 space-y-3">
          <label className="label">Limite de mentions par message</label>
          <input type="number" className="input-field" value={cfg.mentionSpamLimit} onChange={e => update({ mentionSpamLimit: Number(e.target.value) })} />
        </div>

        <div className="card p-6 space-y-3">
          <label className="label">Mots bannis</label>
          <div className="flex gap-2">
            <input className="input-field" value={wordInput} onChange={e => setWordInput(e.target.value)} placeholder="Ajouter un mot..." />
            <button
              className="btn-ghost text-sm shrink-0"
              onClick={() => { if (wordInput.trim()) { update({ bannedWords: [...cfg.bannedWords, wordInput.trim()] }); setWordInput(''); } }}
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {cfg.bannedWords.map((w, i) => (
              <span key={i} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2">
                {w}
                <button onClick={() => update({ bannedWords: cfg.bannedWords.filter((_, idx) => idx !== i) })} className="text-white/40 hover:text-red-400">✕</button>
              </span>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <label className="label">Action en cas d'infraction</label>
          <select className="input-field" value={cfg.action} onChange={e => update({ action: e.target.value })}>
            <option value="delete">Supprimer le message</option>
            <option value="warn">Supprimer + avertir</option>
            <option value="mute">Supprimer + mute 10 min</option>
            <option value="kick">Supprimer + expulser</option>
          </select>
        </div>
      </div>
    </div>
  );
}
