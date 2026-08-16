import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';
import CardPreview from '../components/CardPreview';

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2 bg-base-850 border border-white/10 rounded-xl px-2 py-1.5">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent" />
        <span className="text-xs text-white/50 font-mono">{value}</span>
      </div>
    </div>
  );
}

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
  const updateCard = (patch) => setCfg(prev => ({ ...prev, levelUpCard: { ...prev.levelUpCard, ...patch } }));
  const updateRankCard = (patch) => setCfg(prev => ({ ...prev, rankCard: { ...prev.rankCard, ...patch } }));

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
          <p className="text-white/40 text-sm mt-1">Configure la progression, les récompenses, et personnalise les cartes.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      {/* --- Réglages généraux --- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">
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

      {/* --- Carte de passage de niveau --- */}
      <div className="mb-3">
        <h2 className="font-display text-lg font-bold">🎉 Message de niveau</h2>
        <p className="text-white/40 text-sm">Choisis un simple texte, une carte générée personnalisable, ou les deux.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mb-10">
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <label className="label">Format</label>
            <div className="flex gap-2">
              {['text', 'card', 'both'].map(m => (
                <button
                  key={m}
                  onClick={() => update({ levelUpMode: m })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${cfg.levelUpMode === m ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  {m === 'text' ? 'Texte' : m === 'card' ? 'Carte générée' : 'Les deux'}
                </button>
              ))}
            </div>

            {(cfg.levelUpMode === 'text' || cfg.levelUpMode === 'both') && (
              <div>
                <label className="label">Message (variables : {'{user}'} {'{level}'})</label>
                <input className="input-field" value={cfg.levelUpMessage} onChange={e => update({ levelUpMessage: e.target.value })} />
              </div>
            )}
          </div>

          {(cfg.levelUpMode === 'card' || cfg.levelUpMode === 'both') && (
            <div className="card p-6 space-y-5">
              <p className="label mb-0">Carte de niveau (même mise en page que /rank : pseudo, niveau, rang, barre XP)</p>

              <div>
                <label className="label">Image de fond personnalisée (URL, optionnel)</label>
                <input className="input-field" placeholder="https://..." value={cfg.levelUpCard.backgroundUrl} onChange={e => updateCard({ backgroundUrl: e.target.value })} />
              </div>

              {cfg.levelUpCard.backgroundUrl && (
                <div>
                  <label className="label">Assombrissement du fond ({cfg.levelUpCard.backgroundOverlayOpacity}%)</label>
                  <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.levelUpCard.backgroundOverlayOpacity} onChange={e => updateCard({ backgroundOverlayOpacity: Number(e.target.value) })} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Fond début (dégradé)" value={cfg.levelUpCard.backgroundColorStart} onChange={v => updateCard({ backgroundColorStart: v })} />
                <ColorField label="Fond fin (dégradé)" value={cfg.levelUpCard.backgroundColorEnd} onChange={v => updateCard({ backgroundColorEnd: v })} />
                <ColorField label="Texte" value={cfg.levelUpCard.textColor} onChange={v => updateCard({ textColor: v })} />
                <ColorField label="Accent (niveau + barre XP)" value={cfg.levelUpCard.accentColor} onChange={v => updateCard({ accentColor: v })} />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
                <div>
                  <label className="label">Avatar horizontal ({cfg.levelUpCard.avatarX}%)</label>
                  <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.levelUpCard.avatarX} onChange={e => updateCard({ avatarX: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Avatar vertical ({cfg.levelUpCard.avatarY}%)</label>
                  <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.levelUpCard.avatarY} onChange={e => updateCard({ avatarY: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Avatar taille ({cfg.levelUpCard.avatarSize}%)</label>
                  <input type="range" min="10" max="100" className="w-full accent-signal-500" value={cfg.levelUpCard.avatarSize} onChange={e => updateCard({ avatarSize: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}
        </div>

        {(cfg.levelUpMode === 'card' || cfg.levelUpMode === 'both') && (
          <CardPreview guildId={guildId} type="levelup" cfg={cfg.levelUpCard} note="Valeurs d'exemple : niveau 7, rang #1, 120/400 XP." />
        )}
      </div>

      {/* --- Carte /rank --- */}
      <div className="mb-3">
        <h2 className="font-display text-lg font-bold">🏆 Carte /rank</h2>
        <p className="text-white/40 text-sm">Personnalise le visuel affiché par la commande /rank.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Image de fond personnalisée (URL, optionnel)</label>
            <input className="input-field" placeholder="https://..." value={cfg.rankCard.backgroundUrl} onChange={e => updateRankCard({ backgroundUrl: e.target.value })} />
          </div>

          {cfg.rankCard.backgroundUrl && (
            <div>
              <label className="label">Assombrissement du fond ({cfg.rankCard.backgroundOverlayOpacity}%)</label>
              <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.rankCard.backgroundOverlayOpacity} onChange={e => updateRankCard({ backgroundOverlayOpacity: Number(e.target.value) })} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Fond début (dégradé)" value={cfg.rankCard.backgroundColorStart} onChange={v => updateRankCard({ backgroundColorStart: v })} />
            <ColorField label="Fond fin (dégradé)" value={cfg.rankCard.backgroundColorEnd} onChange={v => updateRankCard({ backgroundColorEnd: v })} />
            <ColorField label="Texte" value={cfg.rankCard.textColor} onChange={v => updateRankCard({ textColor: v })} />
            <ColorField label="Accent (barre XP + niveau)" value={cfg.rankCard.accentColor} onChange={v => updateRankCard({ accentColor: v })} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
            <div>
              <label className="label">Avatar horizontal ({cfg.rankCard.avatarX}%)</label>
              <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.rankCard.avatarX} onChange={e => updateRankCard({ avatarX: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Avatar vertical ({cfg.rankCard.avatarY}%)</label>
              <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.rankCard.avatarY} onChange={e => updateRankCard({ avatarY: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Avatar taille ({cfg.rankCard.avatarSize}%)</label>
              <input type="range" min="10" max="100" className="w-full accent-signal-500" value={cfg.rankCard.avatarSize} onChange={e => updateRankCard({ avatarSize: Number(e.target.value) })} />
            </div>
          </div>

          <p className="text-[11px] text-white/30">
            Le pseudo, le rang, le niveau et la barre XP se positionnent automatiquement à droite de l'avatar (pas de repositionnement individuel sur cette carte).
          </p>
        </div>

        <CardPreview guildId={guildId} type="rank" cfg={cfg.rankCard} note="Valeurs d'exemple : rang #3, niveau 12, 340/500 XP." />
      </div>
    </div>
  );
}
