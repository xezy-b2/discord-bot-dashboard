import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Toggle from '../components/Toggle';
import { useGuildMeta } from '../hooks/useGuildMeta';

export default function Automod() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
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

        <div className="card p-6 space-y-3">
          <label className="label mb-0">Salons exemptés</label>
          <p className="text-[11px] text-white/30">Aucune règle d'auto-modération ne s'applique dans les salons sélectionnés.</p>
          <div className="flex flex-wrap gap-2">
            {channels.map(c => {
              const active = cfg.ignoredChannels.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => update({
                    ignoredChannels: active
                      ? cfg.ignoredChannels.filter(id => id !== c.id)
                      : [...cfg.ignoredChannels, c.id]
                  })}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${active ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  #{c.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <label className="label mb-0">Rôles exemptés</label>
          <p className="text-[11px] text-white/30">Les membres ayant un de ces rôles ne sont jamais concernés par l'auto-modération.</p>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => {
              const active = cfg.ignoredRoles.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => update({
                    ignoredRoles: active
                      ? cfg.ignoredRoles.filter(id => id !== r.id)
                      : [...cfg.ignoredRoles, r.id]
                  })}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${active ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  {r.name}
                </button>
              );
            })}
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
