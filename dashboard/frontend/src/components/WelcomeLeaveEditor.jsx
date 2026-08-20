import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import LivePreview from './LivePreview';
import Toggle from './Toggle';

const VARIABLES = ['{user}', '{username}', '{tag}', '{server}', '{memberCount}'];

export default function WelcomeLeaveEditor({ type }) {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(res.data[type]));
  }, [guildId, type]);

  const update = (patch) => {
    setCfg(prev => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    await api.patch(`/config/${guildId}/${type}`, cfg);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  const title = type === 'welcome' ? 'Message de bienvenue' : 'Message de départ';
  const emoji = type === 'welcome' ? '👋' : '🚪';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">{emoji} {title}</h1>
          <p className="text-white/40 text-sm mt-1">Personnalise l'apparence et le texte, l'aperçu se met à jour en direct.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-400">✓ Sauvegardé</span>}
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <div className="card p-6">
            <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label={`Activer le message de ${type === 'welcome' ? 'bienvenue' : 'départ'}`} />
          </div>

          {cfg.enabled && (
            <>
          <div className="card p-6 space-y-5">
            <div>
              <label className="label">Salon d'envoi</label>
              <select className="input-field" value={cfg.channelId || ''} onChange={e => update({ channelId: e.target.value })}>
                <option value="">— Choisir un salon —</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Format</label>
              <div className="flex gap-2">
                {['image', 'embed', 'both'].map(m => (
                  <button
                    key={m}
                    onClick={() => update({ mode: m })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${cfg.mode === m ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                  >
                    {m === 'image' ? 'Image' : m === 'embed' ? 'Embed' : 'Les deux'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Message texte</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                value={cfg.message}
                onChange={e => update({ message: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {VARIABLES.map(v => (
                  <button
                    key={v}
                    onClick={() => update({ message: (cfg.message || '') + ' ' + v })}
                    className="text-[11px] bg-white/5 hover:bg-white/10 text-white/50 px-2 py-1 rounded-md font-mono"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(cfg.mode === 'embed' || cfg.mode === 'both') && (
            <div className="card p-6 space-y-4">
              <p className="label mb-0">Embed</p>
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Couleur" value={cfg.embedColor} onChange={v => update({ embedColor: v })} />
                <div className="flex items-end pb-1">
                  <Toggle checked={cfg.embedThumbnail} onChange={v => update({ embedThumbnail: v })} label="Miniature avatar" />
                </div>
              </div>

              <Toggle checked={cfg.embedImageEnabled} onChange={v => update({ embedImageEnabled: v })} label="Afficher une grande image dans l'embed" />

              {cfg.embedImageEnabled && (
                <div>
                  <label className="label">Source de l'image</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => update({ embedImageSource: 'card' })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${cfg.embedImageSource === 'card' ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                    >
                      Carte générée (recommandé)
                    </button>
                    <button
                      onClick={() => update({ embedImageSource: 'avatar' })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${cfg.embedImageSource === 'avatar' ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                    >
                      Photo de profil seule
                    </button>
                    <button
                      onClick={() => update({ embedImageSource: 'custom' })}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${cfg.embedImageSource === 'custom' ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                    >
                      Image fixe (sans avatar)
                    </button>
                  </div>

                  {cfg.embedImageSource === 'card' && (
                    <p className="text-[11px] text-white/30 mt-2">
                      ✓ La carte se configure juste en-dessous (titre, fond, position de l'avatar...) — c'est exactement le même moteur que le mode Image.
                    </p>
                  )}

                  {cfg.embedImageSource === 'custom' && (
                    <div className="mt-3">
                      <label className="label">URL de l'image</label>
                      <input
                        className="input-field"
                        placeholder="https://..."
                        value={cfg.embedImageUrl}
                        onChange={e => update({ embedImageUrl: e.target.value })}
                      />
                      <p className="text-[11px] text-white/30 mt-1.5">
                        Image fixe, identique pour tout le monde (l'avatar n'apparaît pas dessus).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(cfg.mode === 'image' || cfg.mode === 'both' || (cfg.mode === 'embed' && cfg.embedImageEnabled && cfg.embedImageSource === 'card')) && (
            <div className="card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <p className="label mb-0">Carte image {cfg.mode === 'embed' && '(utilisée comme image de l\'embed ci-dessus)'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Titre</label>
                  <input className="input-field" value={cfg.title} onChange={e => update({ title: e.target.value })} />
                </div>
                <div>
                  <label className="label">Sous-titre</label>
                  <input className="input-field" value={cfg.subtitle} onChange={e => update({ subtitle: e.target.value })} />
                </div>
              </div>
              <p className="text-[11px] text-white/30 -mt-2">
                Variables utilisables ici : <code className="text-white/50">{'{username}'}</code> <code className="text-white/50">{'{tag}'}</code> <code className="text-white/50">{'{server}'}</code>
              </p>

              <Toggle checked={cfg.showText} onChange={v => update({ showText: v })} label="Afficher le titre/sous-titre (désactive si ton image de fond a déjà son propre texte)" />

              <div>
                <label className="label">Image de fond personnalisée (URL, optionnel)</label>
                <input className="input-field" placeholder="https://..." value={cfg.backgroundUrl} onChange={e => update({ backgroundUrl: e.target.value })} />
                <p className="text-[11px] text-white/30 mt-1.5">
                  Colle ici l'URL de ton propre visuel (Canva, Photoshop, Imgur...). L'avatar du membre sera superposé par-dessus, à la position que tu choisis ci-dessous.
                </p>
              </div>

              {cfg.backgroundUrl && (
                <div>
                  <label className="label">Assombrissement du fond ({cfg.backgroundOverlayOpacity}%)</label>
                  <input
                    type="range" min="0" max="100"
                    className="w-full accent-signal-500"
                    value={cfg.backgroundOverlayOpacity}
                    onChange={e => update({ backgroundOverlayOpacity: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Fond début (dégradé)" value={cfg.backgroundColorStart} onChange={v => update({ backgroundColorStart: v })} />
                <ColorField label="Fond fin (dégradé)" value={cfg.backgroundColorEnd} onChange={v => update({ backgroundColorEnd: v })} />
                <ColorField label="Texte" value={cfg.textColor} onChange={v => update({ textColor: v })} />
                <ColorField label="Accent" value={cfg.accentColor} onChange={v => update({ accentColor: v })} />
              </div>

              <div className="flex gap-8">
                <Toggle checked={cfg.showAvatar} onChange={v => update({ showAvatar: v })} label="Afficher l'avatar" />
                <Toggle checked={cfg.showMemberCount} onChange={v => update({ showMemberCount: v })} label="Afficher le n° de membre" />
              </div>

              {cfg.showAvatar && (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <p className="label mb-0">Position de l'avatar</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">Horizontal ({cfg.avatarX}%)</label>
                      <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.avatarX} onChange={e => update({ avatarX: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Vertical ({cfg.avatarY}%)</label>
                      <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg.avatarY} onChange={e => update({ avatarY: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Taille ({cfg.avatarSize}%)</label>
                      <input type="range" min="10" max="100" className="w-full accent-signal-500" value={cfg.avatarSize} onChange={e => update({ avatarSize: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
              )}

              {cfg.showText && [
                { key: 'title', label: 'Titre', sizeMin: 10, sizeMax: 100 },
                { key: 'subtitle', label: 'Sous-titre', sizeMin: 10, sizeMax: 100 },
                ...(cfg.showMemberCount ? [{ key: 'memberCount', label: 'N° de membre', sizeMin: 8, sizeMax: 60 }] : [])
              ].map(el => {
                const xKey = `${el.key}X`;
                const yKey = `${el.key}Y`;
                const sizeKey = `${el.key}Size`;
                const isAuto = cfg[xKey] == null;

                return (
                  <div key={el.key} className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="label mb-0">{el.label}</p>
                      <Toggle
                        checked={isAuto}
                        onChange={v => update(v ? { [xKey]: null, [yKey]: null } : { [xKey]: 50, [yKey]: 50 })}
                        label="Position automatique"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className={isAuto ? 'opacity-30 pointer-events-none' : ''}>
                        <label className="label">Horizontal ({cfg[xKey] ?? 50}%)</label>
                        <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg[xKey] ?? 50} onChange={e => update({ [xKey]: Number(e.target.value) })} />
                      </div>
                      <div className={isAuto ? 'opacity-30 pointer-events-none' : ''}>
                        <label className="label">Vertical ({cfg[yKey] ?? 50}%)</label>
                        <input type="range" min="0" max="100" className="w-full accent-signal-500" value={cfg[yKey] ?? 50} onChange={e => update({ [yKey]: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label">Taille ({cfg[sizeKey]}px)</label>
                        <input type="range" min={el.sizeMin} max={el.sizeMax} className="w-full accent-signal-500" value={cfg[sizeKey]} onChange={e => update({ [sizeKey]: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {type === 'welcome' && (
            <div className="card p-6 space-y-4">
              <Toggle checked={cfg.dmEnabled} onChange={v => update({ dmEnabled: v })} label="Envoyer aussi un message privé au nouveau membre" />
              {cfg.dmEnabled && (
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  value={cfg.dmMessage}
                  onChange={e => update({ dmMessage: e.target.value })}
                />
              )}
            </div>
          )}
            </>
          )}
        </div>

        {cfg.enabled && <LivePreview guildId={guildId} type={type} cfg={cfg} />}
      </div>
    </div>
  );
}

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
