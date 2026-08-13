import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';

export default function Leveling() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newReward, setNewReward] = useState({ level: '', roleId: '' });

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(res.data.leveling));
    api.get(`/leveling/${guildId}/leaderboard`).then(res => setLeaderboard(res.data.slice(0, 10)));
  }, [guildId]);

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    await api.patch(`/config/${guildId}/leveling`, cfg);
    setSaving(false);
  };

  const addReward = () => {
    if (!newReward.level || !newReward.roleId) return;
    update({ roleRewards: [...cfg.roleRewards, { level: Number(newReward.level), roleId: newReward.roleId }] });
    setNewReward({ level: '', roleId: '' });
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">📈 Niveaux & XP</h1>
          <p className="text-white/40 text-sm mt-1">Configure la progression et les récompenses.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="card p-6">
            <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer le système de niveaux" />
          </div>

          <div className="card p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">XP min / message</label>
                <input type="number" className="input-field" value={cfg.xpMin} onChange={e => update({ xpMin: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">XP max / message</label>
                <input type="number" className="input-field" value={cfg.xpMax} onChange={e => update({ xpMax: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Cooldown (sec)</label>
                <input type="number" className="input-field" value={cfg.cooldownSeconds} onChange={e => update({ cooldownSeconds: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <label className="label">Salon d'annonce de niveau</label>
              <select className="input-field" value={cfg.levelUpChannelId || ''} onChange={e => update({ levelUpChannelId: e.target.value || null })}>
                <option value="">Salon du message (par défaut)</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Message de niveau (variables : {'{user}'} {'{level}'})</label>
              <input className="input-field" value={cfg.levelUpMessage} onChange={e => update({ levelUpMessage: e.target.value })} />
            </div>
          </div>

          <div className="card p-6 space-y-3">
            <p className="label mb-0">Récompenses de rôle par niveau</p>
            <div className="flex gap-2">
              <input type="number" placeholder="Niveau" className="input-field w-28" value={newReward.level} onChange={e => setNewReward({ ...newReward, level: e.target.value })} />
              <select className="input-field" value={newReward.roleId} onChange={e => setNewReward({ ...newReward, roleId: e.target.value })}>
                <option value="">— Rôle —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button onClick={addReward} className="btn-ghost text-sm shrink-0">Ajouter</button>
            </div>
            <div className="space-y-2 mt-2">
              {cfg.roleRewards.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-white/5 px-3 py-2 rounded-lg">
                  <span>Niveau {r.level} → {roles.find(role => role.id === r.roleId)?.name || r.roleId}</span>
                  <button onClick={() => update({ roleRewards: cfg.roleRewards.filter((_, idx) => idx !== i) })} className="text-white/40 hover:text-red-400">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="label">Classement actuel</p>
          <div className="space-y-2">
            {leaderboard.map((m, i) => (
              <div key={m.userId} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/60">#{i + 1} <span className="font-mono text-white/40 text-xs">{m.userId}</span></span>
                <span className="text-signal-400 font-medium">Nv. {m.level}</span>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-white/30 text-sm">Aucune donnée pour le moment.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
