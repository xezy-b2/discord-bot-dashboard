import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatus from '../components/SaveStatus';

const EVENT_LABELS = {
  messageDelete: 'Message supprimé',
  messageEdit: 'Message modifié',
  memberJoin: 'Arrivée de membre',
  memberLeave: 'Départ de membre',
  memberBan: 'Bannissement',
  memberUnban: 'Débannissement',
  roleChanges: 'Changements de rôles',
  voiceChanges: 'Activité vocale'
};

export default function Logs() {
  const { guildId } = useParams();
  const { channels } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(res.data.logs));
  }, [guildId]);

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));
  const updateEvent = (key, val) => update({ events: { ...cfg.events, [key]: val } });

  const save = async () => {
    await api.patch(`/config/${guildId}/logs`, cfg);
  };

  const autoSaveStatus = useAutoSave(cfg, save);

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">📜 Logs</h1>
          <p className="text-white/40 text-sm mt-1">Journalise l'activité du serveur dans un salon dédié.</p>
        </div>
        <SaveStatus status={autoSaveStatus} />
      </div>

      <div className="space-y-6 max-w-xl">
        <div className="card p-6">
          <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer les logs" />
        </div>

        {cfg.enabled && (
        <>
        <div className="card p-6">
          <label className="label">Salon de logs</label>
          <select className="input-field" value={cfg.channelId || ''} onChange={e => update({ channelId: e.target.value })}>
            <option value="">— Choisir un salon —</option>
            {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
          </select>
        </div>

        <div className="card p-6 space-y-2">
          <p className="label mb-2">Événements suivis</p>
          {Object.entries(EVENT_LABELS).map(([key, label]) => (
            <Toggle key={key} checked={cfg.events[key]} onChange={v => updateEvent(key, v)} label={label} />
          ))}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
