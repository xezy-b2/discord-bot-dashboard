import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';

export default function Settings() {
  const { guildId } = useParams();
  const { roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(res.data));
  }, [guildId]);

  const save = async () => {
    setSaving(true);
    await api.patch(`/config/${guildId}`, {
      prefix: cfg.prefix,
      moderatorRoleIds: cfg.moderatorRoleIds,
      muteRoleId: cfg.muteRoleId
    });
    setSaving(false);
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  const toggleModRole = (roleId) => {
    const current = cfg.moderatorRoleIds || [];
    const next = current.includes(roleId) ? current.filter(id => id !== roleId) : [...current, roleId];
    setCfg({ ...cfg, moderatorRoleIds: next });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">⚙️ Paramètres</h1>
          <p className="text-white/40 text-sm mt-1">Réglages généraux du bot sur ce serveur.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      <div className="space-y-6 max-w-xl">
        <div className="card p-6">
          <label className="label">Préfixe des commandes texte</label>
          <input className="input-field w-32" value={cfg.prefix} onChange={e => setCfg({ ...cfg, prefix: e.target.value })} />
        </div>

        <div className="card p-6">
          <label className="label">Rôle de mute (utilisé si le timeout natif n'est pas souhaité)</label>
          <select className="input-field" value={cfg.muteRoleId || ''} onChange={e => setCfg({ ...cfg, muteRoleId: e.target.value })}>
            <option value="">— Aucun —</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="card p-6">
          <label className="label mb-3">Rôles modérateurs (accès dashboard supplémentaire)</label>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => toggleModRole(r.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${cfg.moderatorRoleIds?.includes(r.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
