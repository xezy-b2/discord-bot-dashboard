import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';

export default function AutoRoles() {
  const { guildId } = useParams();
  const { roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(res.data.autoRoles));
  }, [guildId]);

  const update = (patch) => {
    setCfg(prev => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const toggleRole = (roleId) => {
    const current = cfg.roleIds || [];
    update({ roleIds: current.includes(roleId) ? current.filter(id => id !== roleId) : [...current, roleId] });
  };

  const save = async () => {
    setSaving(true);
    await api.patch(`/config/${guildId}/autoRoles`, cfg);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🏷️ Rôles automatiques</h1>
          <p className="text-white/40 text-sm mt-1">Rôles à l'arrivée — définis quels rôles doivent être attribués aux nouveaux membres.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-400">✓ Sauvegardé</span>}
          <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
        </div>
      </div>

      <div className="space-y-6 max-w-xl">
        <div className="card p-6">
          <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer l'attribution automatique de rôles" />
        </div>

        <div className="card p-6">
          <label className="label mb-3">Rôles attribués à chaque nouvel arrivant</label>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => toggleRole(r.id)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition ${cfg.roleIds?.includes(r.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
              >
                {r.name}
              </button>
            ))}
            {roles.length === 0 && <p className="text-white/30 text-sm">Aucun rôle disponible.</p>}
          </div>
          <p className="text-[11px] text-white/30 mt-3">
            ⚠️ Le rôle du bot doit être positionné au-dessus des rôles sélectionnés dans la hiérarchie du serveur, sinon l'attribution échouera silencieusement.
          </p>
        </div>
      </div>
    </div>
  );
}
