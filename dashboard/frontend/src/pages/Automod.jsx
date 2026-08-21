import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Toggle from '../components/Toggle';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Modal from '../components/Modal';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatus from '../components/SaveStatus';

function ActionSelect({ value, onChange }) {
  return (
    <div>
      <label className="label mb-2">Sanction en cas d'infraction</label>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}>
        <option value="delete">Supprimer le message</option>
        <option value="warn">Supprimer + avertir</option>
        <option value="mute">Supprimer + mute 10 min</option>
        <option value="kick">Supprimer + expulser</option>
      </select>
    </div>
  );
}

function ExemptPicker({ channels, roles, value, onChange }) {
  const [channelToAdd, setChannelToAdd] = useState('');
  const [roleToAdd, setRoleToAdd] = useState('');

  const addChannel = () => {
    if (!channelToAdd || value.ignoredChannels?.includes(channelToAdd)) return;
    onChange({ ignoredChannels: [...(value.ignoredChannels || []), channelToAdd] });
    setChannelToAdd('');
  };

  const addRole = () => {
    if (!roleToAdd || value.ignoredRoles?.includes(roleToAdd)) return;
    onChange({ ignoredRoles: [...(value.ignoredRoles || []), roleToAdd] });
    setRoleToAdd('');
  };

  const removeChannel = (id) => onChange({ ignoredChannels: value.ignoredChannels.filter(x => x !== id) });
  const removeRole = (id) => onChange({ ignoredRoles: value.ignoredRoles.filter(x => x !== id) });

  return (
    <div className="space-y-4 pt-3 border-t border-white/5">
      <div>
        <label className="label mb-2">Salons exemptés</label>
        <div className="flex gap-2">
          <select className="input-field" value={channelToAdd} onChange={e => setChannelToAdd(e.target.value)}>
            <option value="">— Choisir un salon —</option>
            {channels.filter(c => !value.ignoredChannels?.includes(c.id)).map(c => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
          <button onClick={addChannel} className="btn-ghost text-sm shrink-0">Ajouter</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {value.ignoredChannels?.map(id => (
            <span key={id} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2">
              #{channels.find(c => c.id === id)?.name || id}
              <button onClick={() => removeChannel(id)} className="text-white/40 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="label mb-2">Rôles exemptés</label>
        <div className="flex gap-2">
          <select className="input-field" value={roleToAdd} onChange={e => setRoleToAdd(e.target.value)}>
            <option value="">— Choisir un rôle —</option>
            {roles.filter(r => !value.ignoredRoles?.includes(r.id)).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button onClick={addRole} className="btn-ghost text-sm shrink-0">Ajouter</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {value.ignoredRoles?.map(id => (
            <span key={id} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2">
              {roles.find(r => r.id === id)?.name || id}
              <button onClick={() => removeRole(id)} className="text-white/40 hover:text-red-400">✕</button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, checked, onToggle, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-white/40 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOpen(true)}
              title="Réglages"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-white/5 text-white/40 hover:bg-white/10 transition"
            >
              ⚙️
            </button>
            <Toggle checked={checked} onChange={onToggle} />
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </Modal>
    </>
  );
}

function isPlainObject(val) {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export default function Automod() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [wordInput, setWordInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [protectedRoleToAdd, setProtectedRoleToAdd] = useState('');

  // Reconstruit une forme garantie, quelle que soit la structure deja presente en base
  // (protege contre les anciennes configs a plat, incompatibles avec le nouveau schema imbrique).
  const VALID_ACTIONS = ['delete', 'warn', 'mute', 'kick'];
  const safeAction = (val) => VALID_ACTIONS.includes(val) ? val : 'delete';

  const normalize = (raw = {}) => {
    const cfg = {
      enabled: raw.enabled ?? false,
      bannedWords: { enabled: false, words: [], action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.bannedWords) ? raw.bannedWords : {}) },
      invite: { enabled: false, action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.invite) ? raw.invite : {}) },
      link: { enabled: false, action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.link) ? raw.link : {}) },
      caps: { enabled: false, percent: 70, action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.caps) ? raw.caps : {}) },
      emojiSpam: { enabled: false, maxEmojis: 10, action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.emojiSpam) ? raw.emojiSpam : {}) },
      mentionSpam: { enabled: false, limit: 5, action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.mentionSpam) ? raw.mentionSpam : {}) },
      pingProtection: { enabled: false, protectedUserIds: [], protectedRoleIds: [], action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.pingProtection) ? raw.pingProtection : {}) },
      spam: { enabled: true, threshold: 5, intervalMs: 5000, action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.spam) ? raw.spam : {}) },
      markdown: { enabled: false, action: 'delete', ignoredChannels: [], ignoredRoles: [], ...(isPlainObject(raw.markdown) ? raw.markdown : {}) }
    };

    // Ecrase toute valeur d'action corrompue (ex: [] issue d'une ancienne structure de schema)
    // par une valeur valide, APRES le spread, pour ne jamais renvoyer une valeur invalide au serveur.
    for (const key of ['bannedWords', 'invite', 'link', 'caps', 'emojiSpam', 'mentionSpam', 'pingProtection', 'spam', 'markdown']) {
      cfg[key].action = safeAction(cfg[key].action);
    }

    return cfg;
  };

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(normalize(res.data.automod)));
  }, [guildId]);

  const updateGlobal = (patch) => setCfg(prev => ({ ...prev, ...patch }));
  const updateFeature = (key, patch) => setCfg(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const save = async () => {
    await api.patch(`/config/${guildId}/automod`, cfg);
  };

  const autoSaveStatus = useAutoSave(cfg, save);

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🛡️ Auto-modération</h1>
          <p className="text-white/40 text-sm mt-1">Chaque fonctionnalité a ses propres réglages et ses propres exemptions de salons/rôles.</p>
        </div>
        <SaveStatus status={autoSaveStatus} />
      </div>

      <div className="card p-6 mb-6 max-w-3xl">
        <Toggle checked={cfg.enabled} onChange={v => updateGlobal({ enabled: v })} label="Activer l'auto-modération (interrupteur général)" />
      </div>

      {cfg.enabled && (
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
          <ActionSelect value={cfg.bannedWords.action} onChange={v => updateFeature('bannedWords', { action: v })} />
          <ExemptPicker channels={channels} roles={roles} value={cfg.bannedWords} onChange={p => updateFeature('bannedWords', p)} />
        </FeatureCard>

        <FeatureCard
          title="Invitations Discord"
          description="Détection de liens d'invitations Discord."
          checked={cfg.invite.enabled}
          onToggle={v => updateFeature('invite', { enabled: v })}
        >
          <ActionSelect value={cfg.invite.action} onChange={v => updateFeature('invite', { action: v })} />
          <ExemptPicker channels={channels} roles={roles} value={cfg.invite} onChange={p => updateFeature('invite', p)} />
        </FeatureCard>

        <FeatureCard
          title="Liens externes"
          description="Détection de l'utilisation de liens externes."
          checked={cfg.link.enabled}
          onToggle={v => updateFeature('link', { enabled: v })}
        >
          <ActionSelect value={cfg.link.action} onChange={v => updateFeature('link', { action: v })} />
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
          <ActionSelect value={cfg.caps.action} onChange={v => updateFeature('caps', { action: v })} />
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
          <ActionSelect value={cfg.emojiSpam.action} onChange={v => updateFeature('emojiSpam', { action: v })} />
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
          <ActionSelect value={cfg.mentionSpam.action} onChange={v => updateFeature('mentionSpam', { action: v })} />
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
            <div className="flex gap-2">
              <select className="input-field" value={protectedRoleToAdd} onChange={e => setProtectedRoleToAdd(e.target.value)}>
                <option value="">— Choisir un rôle —</option>
                {roles.filter(r => !cfg.pingProtection.protectedRoleIds.includes(r.id)).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button
                className="btn-ghost text-sm shrink-0"
                onClick={() => {
                  if (!protectedRoleToAdd) return;
                  updateFeature('pingProtection', { protectedRoleIds: [...cfg.pingProtection.protectedRoleIds, protectedRoleToAdd] });
                  setProtectedRoleToAdd('');
                }}
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {cfg.pingProtection.protectedRoleIds.map(id => (
                <span key={id} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2">
                  {roles.find(r => r.id === id)?.name || id}
                  <button
                    onClick={() => updateFeature('pingProtection', { protectedRoleIds: cfg.pingProtection.protectedRoleIds.filter(x => x !== id) })}
                    className="text-white/40 hover:text-red-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
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
          <ActionSelect value={cfg.pingProtection.action} onChange={v => updateFeature('pingProtection', { action: v })} />
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
          <ActionSelect value={cfg.spam.action} onChange={v => updateFeature('spam', { action: v })} />
          <ExemptPicker channels={channels} roles={roles} value={cfg.spam} onChange={p => updateFeature('spam', p)} />
        </FeatureCard>

        <FeatureCard
          title="Markdown interdit"
          description="Détection de spoilers, titres et blocs de code abusifs."
          checked={cfg.markdown.enabled}
          onToggle={v => updateFeature('markdown', { enabled: v })}
        >
          <ActionSelect value={cfg.markdown.action} onChange={v => updateFeature('markdown', { action: v })} />
          <ExemptPicker channels={channels} roles={roles} value={cfg.markdown} onChange={p => updateFeature('markdown', p)} />
        </FeatureCard>
      </div>
      )}
    </div>
  );
}
