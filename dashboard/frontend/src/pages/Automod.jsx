import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Toggle from '../components/Toggle';
import { useGuildMeta } from '../hooks/useGuildMeta';

function ExemptPicker({ channels, roles, value, onChange }) {
  const toggle = (key, id) => {
    const list = value[key] || [];
    onChange({ [key]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] });
  };

  return (
    <div className="space-y-3 pt-3 border-t border-white/5">
      <div>
        <label className="label mb-2">Salons exemptés</label>
        <div className="flex flex-wrap gap-1.5">
          {channels.map(c => (
            <button
              key={c.id}
              onClick={() => toggle('ignoredChannels', c.id)}
              className={`text-[11px] px-2 py-1 rounded-md border transition ${value.ignoredChannels?.includes(c.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
            >
              #{c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label mb-2">Rôles exemptés</label>
        <div className="flex flex-wrap gap-1.5">
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => toggle('ignoredRoles', r.id)}
              className={`text-[11px] px-2 py-1 rounded-md border transition ${value.ignoredRoles?.includes(r.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, checked, onToggle, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-white/40 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOpen(!open)}
            title="Réglages"
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${open ? 'bg-signal-500/20 text-signal-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            ⚙️
          </button>
          <Toggle checked={checked} onChange={onToggle} />
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function isPlainObject(val) {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export default function Automod() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');

  // Reconstruit une forme garantie, quelle que soit la structure deja presente en base
  // (protege contre les anciennes configs a plat, incompatibles avec le nouveau schema imbrique).
  const normalize = (raw = {}) => ({
    enabled: raw.enabled ?? false,
    bannedWords: { enabled: false, words: [], ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.bannedWords) ? raw.bannedWords : {}) },
    invite: { enabled: false, ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.invite) ? raw.invite : {}) },
    link: { enabled: false, ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.link) ? raw.link : {}) },
    caps: { enabled: false, percent: 70, ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.caps) ? raw.caps : {}) },
    emojiSpam: { enabled: false, maxEmojis: 10, ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.emojiSpam) ? raw.emojiSpam : {}) },
    mentionSpam: { enabled: false, limit: 5, ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.mentionSpam) ? raw.mentionSpam : {}) },
    pingProtection: { enabled: false, protectedUserIds: [], protectedRoleIds: [], ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.pingProtection) ? raw.pingProtection : {}) },
    spam: { enabled: true, threshold: 5, intervalMs: 5000, ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.spam) ? raw.spam : {}) },
    markdown: { enabled: false, ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.markdown) ? raw.markdown : {}) },
    action: raw.action || 'delete'
  });

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(normalize(res.data.automod)));
  }, [guildId]);

  const updateGlobal = (patch) => setCfg(prev => ({ ...prev, ...patch }));
  const updateFeature = (key, patch) => setCfg(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

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
          <p className="text-white/40 text-sm mt-1">Chaque fonctionnalité a ses propres réglages et ses propres exemptions de salons/rôles.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      <div className="card p-6 mb-6 max-w-3xl">
        <Toggle checked={cfg.enabled} onChange={v => updateGlobal({ enabled: v })} label="Activer l'auto-modération (interrupteur général)" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mb-6">
        <FeatureCard
          title="Vocabulaire interdit"
          description="Détection de mots ou vocabulaire interdit."
          checked={cfg.bannedWords.enabled}
          onToggle={v => updateFeature('bannedWords', { enabled: v })}
        >
          <div className="flex gap-2">
            <input className="input-field" value={wordInput} onChange={e => setWordInput(e.target.value)} placeholder="Ajouter un mot..." />
            <button
              className="btn-ghost text-sm shrink-0"
              onClick={() => { if (wordInput.trim()) { updateFeature('bannedWords', { words: [...cfg.bannedWords.words, wordInput.trim()] }); setWordInput(''); } }}
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cfg.bannedWords.words.map((w, i) => (
              <span key={i} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2">
                {w}
                <button onClick={() => updateFeature('bannedWords', { words: cfg.bannedWords.words.filter((_, idx) => idx !== i) })} className="text-white/40 hover:text-red-400">✕</button>
              </span>
            ))}
          </div>
          <ExemptPicker channels={channels} roles={roles} value={cfg.bannedWords} onChange={p => updateFeature('bannedWords', p)} />
        </FeatureCard>

        <FeatureCard
          title="Invitations Discord"
          description="Détection de liens d'invitations Discord."
          checked={cfg.invite.enabled}
          onToggle={v => updateFeature('invite', { enabled: v })}
        >
          <ExemptPicker channels={channels} roles={roles} value={cfg.invite} onChange={p => updateFeature('invite', p)} />
        </FeatureCard>

        <FeatureCard
          title="Liens externes"
          description="Détection de l'utilisation de liens externes."
          checked={cfg.link.enabled}
          onToggle={v => updateFeature('link', { enabled: v })}
        >
          <ExemptPicker channels={channels} roles={roles} value={cfg.link} onChange={p => updateFeature('link', p)} />
        </FeatureCard>

        <FeatureCard
          title="Majuscules excessives"
          description="Détection de l'utilisation abusive de majuscules."
          checked={cfg.caps.enabled}
          onToggle={v => updateFeature('caps', { enabled: v })}
        >
          <label className="label">Seuil ({cfg.caps.percent}% de majuscules)</label>
          <input type="range" min="10" max="100" className="w-full accent-signal-500" value={cfg.caps.percent} onChange={e => updateFeature('caps', { percent: Number(e.target.value) })} />
          <ExemptPicker channels={channels} roles={roles} value={cfg.caps} onChange={p => updateFeature('caps', p)} />
        </FeatureCard>

        <FeatureCard
          title="Émojis excessifs"
          description="Détection de l'utilisation abusive d'émojis."
          checked={cfg.emojiSpam.enabled}
          onToggle={v => updateFeature('emojiSpam', { enabled: v })}
        >
          <label className="label">Nombre d'émojis max par message</label>
          <input type="number" min="1" max="50" className="input-field w-24" value={cfg.emojiSpam.maxEmojis} onChange={e => updateFeature('emojiSpam', { maxEmojis: Number(e.target.value) })} />
          <ExemptPicker channels={channels} roles={roles} value={cfg.emojiSpam} onChange={p => updateFeature('emojiSpam', p)} />
        </FeatureCard>

        <FeatureCard
          title="Mentions excessives"
          description="Détection de l'utilisation abusive de mentions."
          checked={cfg.mentionSpam.enabled}
          onToggle={v => updateFeature('mentionSpam', { enabled: v })}
        >
          <label className="label">Nombre de mentions max par message</label>
          <input type="number" min="1" max="30" className="input-field w-24" value={cfg.mentionSpam.limit} onChange={e => updateFeature('mentionSpam', { limit: Number(e.target.value) })} />
          <ExemptPicker channels={channels} roles={roles} value={cfg.mentionSpam} onChange={p => updateFeature('mentionSpam', p)} />
        </FeatureCard>

        <FeatureCard
          title="Pings interdits"
          description="Protège des membres/rôles précis contre les mentions."
          checked={cfg.pingProtection.enabled}
          onToggle={v => updateFeature('pingProtection', { enabled: v })}
        >
          <div>
            <label className="label mb-2">Rôles protégés (interdits de mention)</label>
            <div className="flex flex-wrap gap-1.5">
              {roles.map(r => {
                const active = cfg.pingProtection.protectedRoleIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => updateFeature('pingProtection', {
                      protectedRoleIds: active
                        ? cfg.pingProtection.protectedRoleIds.filter(id => id !== r.id)
                        : [...cfg.pingProtection.protectedRoleIds, r.id]
                    })}
                    className={`text-[11px] px-2 py-1 rounded-md border transition ${active ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label mb-2">Membres protégés (par ID)</label>
            <div className="flex gap-2">
              <input className="input-field" placeholder="ID Discord du membre" value={userIdInput} onChange={e => setUserIdInput(e.target.value)} />
              <button
                className="btn-ghost text-sm shrink-0"
                onClick={() => { if (userIdInput.trim()) { updateFeature('pingProtection', { protectedUserIds: [...cfg.pingProtection.protectedUserIds, userIdInput.trim()] }); setUserIdInput(''); } }}
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {cfg.pingProtection.protectedUserIds.map((id, i) => (
                <span key={i} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2 font-mono">
                  {id}
                  <button onClick={() => updateFeature('pingProtection', { protectedUserIds: cfg.pingProtection.protectedUserIds.filter((_, idx) => idx !== i) })} className="text-white/40 hover:text-red-400">✕</button>
                </span>
              ))}
            </div>
          </div>
          <ExemptPicker channels={channels} roles={roles} value={cfg.pingProtection} onChange={p => updateFeature('pingProtection', p)} />
        </FeatureCard>

        <FeatureCard
          title="Spam de messages"
          description="Détection de l'envoi massif de messages."
          checked={cfg.spam.enabled}
          onToggle={v => updateFeature('spam', { enabled: v })}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Seuil (messages)</label>
              <input type="number" className="input-field" value={cfg.spam.threshold} onChange={e => updateFeature('spam', { threshold: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Intervalle (ms)</label>
              <input type="number" className="input-field" value={cfg.spam.intervalMs} onChange={e => updateFeature('spam', { intervalMs: Number(e.target.value) })} />
            </div>
          </div>
          <ExemptPicker channels={channels} roles={roles} value={cfg.spam} onChange={p => updateFeature('spam', p)} />
        </FeatureCard>

        <FeatureCard
          title="Markdown interdit"
          description="Détection de spoilers, titres et blocs de code abusifs."
          checked={cfg.markdown.enabled}
          onToggle={v => updateFeature('markdown', { enabled: v })}
        >
          <ExemptPicker channels={channels} roles={roles} value={cfg.markdown} onChange={p => updateFeature('markdown', p)} />
        </FeatureCard>
      </div>

      <div className="card p-6 max-w-3xl">
        <label className="label">Action en cas d'infraction (s'applique à toutes les fonctionnalités)</label>
        <select className="input-field" value={cfg.action} onChange={e => updateGlobal({ action: e.target.value })}>
          <option value="delete">Supprimer le message</option>
          <option value="warn">Supprimer + avertir</option>
          <option value="mute">Supprimer + mute 10 min</option>
          <option value="kick">Supprimer + expulser</option>
        </select>
      </div>
    </div>
  );
}
