import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function Birthdays() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [list, setList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/birthdays/${guildId}/config`).then(res => setCfg(res.data));
    api.get(`/birthdays/${guildId}/list`).then(res => setList(res.data));
  }, [guildId]);

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    await api.patch(`/birthdays/${guildId}/config`, cfg);
    setSaving(false);
  };

  const remove = async (userId) => {
    await api.delete(`/birthdays/${guildId}/${userId}`);
    setList(list.filter(b => b.userId !== userId));
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🎂 Anniversaires</h1>
          <p className="text-white/40 text-sm mt-1">
            Les membres enregistrent leur date avec <code className="text-signal-400">/anniversaire definir</code>, la consultent avec <code className="text-signal-400">/anniversaire liste</code>, et la retirent avec <code className="text-signal-400">/anniversaire retirer</code>.
          </p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-4xl">
        <div className="space-y-6">
          <div className="card p-6">
            <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer les annonces d'anniversaire" />
          </div>

          {cfg.enabled && (
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Salon d'annonce</label>
              <select className="input-field" value={cfg.channelId || ''} onChange={e => update({ channelId: e.target.value })}>
                <option value="">— Choisir un salon —</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Message (variables : {'{user}'} {'{age}'})</label>
              <input className="input-field" value={cfg.message} onChange={e => update({ message: e.target.value })} />
            </div>

            <div>
              <label className="label">Rôle "anniversaire" du jour (optionnel, retiré automatiquement le lendemain)</label>
              <select className="input-field" value={cfg.roleId || ''} onChange={e => update({ roleId: e.target.value })}>
                <option value="">— Aucun —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          )}
        </div>

        <div className="card p-5">
          <p className="label">Anniversaires enregistrés ({list.length})</p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {list.map(b => (
              <div key={b.userId} className="flex items-center justify-between text-sm bg-white/5 px-3 py-2 rounded-lg">
                <span className="font-mono text-xs">{b.userId}</span>
                <span className="text-white/60">{b.day} {MOIS[b.month - 1]}</span>
                <button onClick={() => remove(b.userId)} className="text-white/40 hover:text-red-400">✕</button>
              </div>
            ))}
            {list.length === 0 && <p className="text-white/30 text-sm">Aucun anniversaire enregistré.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
