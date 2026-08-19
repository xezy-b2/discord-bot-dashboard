import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Toggle from '../components/Toggle';
import { useGuildMeta } from '../hooks/useGuildMeta';

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
          {children && (
            <button
              onClick={() => setOpen(!open)}
              title="Réglages"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition ${open ? 'bg-signal-500/20 text-signal-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              ⚙️
            </button>
          )}
          <Toggle checked={checked} onChange={onToggle} />
        </div>
      </div>

      {open && children && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Automod() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');

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

  const toggleInList = (key, id) => {
    const list = cfg[key];
    update({ [key]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🛡️ Auto-modération</h1>
          <p className="text-white/40 text-sm mt-1">Configure les différentes fonctionnalités d'auto-modération, une par une.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      <div className="card p-6 mb-6 max-w-3xl">
        <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer l'auto-modération (interrupteur général)" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mb-6">
        <FeatureCard
          title="Vocabulaire interdit"
          description="Détection de mots ou vocabulaire interdit."
          checked={cfg.antiBannedWords}
          onToggle={v => update({ antiBannedWords: v })}
        >
          <div className="flex gap-2">
            <input className="input-field" value={wordInput} onChange={e => setWordInput(e.target.value)} placeholder="Ajouter un mot..." />
            <button
              className="btn-ghost text-sm shrink-0"
              onClick={() => { if (wordInput.trim()) { update({ bannedWords: [...cfg.bannedWords, wordInput.trim()] }); setWordInput(''); } }}
            >
              Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cfg.bannedWords.map((w, i) => (
              <span key={i} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2">
                {w}
                <button onClick={() => update({ bannedWords: cfg.bannedWords.filter((_, idx) => idx !== i) })} className="text-white/40 hover:text-red-400">✕</button>
              </span>
            ))}
          </div>
        </FeatureCard>

        <FeatureCard
          title="Invitations Discord"
          description="Détection de liens d'invitations Discord."
          checked={cfg.antiInvite}
          onToggle={v => update({ antiInvite: v })}
        />

        <FeatureCard
          title="Liens externes"
          description="Détection de l'utilisation de liens externes."
          checked={cfg.antiLink}
          onToggle={v => update({ antiLink: v })}
        />

        <FeatureCard
          title="Majuscules excessives"
          description="Détection de l'utilisation abusive de majuscules."
          checked={cfg.antiCaps}
          onToggle={v => update({ antiCaps: v })}
        >
          <label className="label">Seuil ({cfg.antiCapsPercent}% de majuscules)</label>
          <input type="range" min="10" max="100" className="w-full accent-signal-500" value={cfg.antiCapsPercent} onChange={e => update({ antiCapsPercent: Number(e.target.value) })} />
        </FeatureCard>

        <FeatureCard
          title="Émojis excessifs"
          description="Détection de l'utilisation abusive d'émojis."
          checked={cfg.antiEmojiSpam}
          onToggle={v => update({ antiEmojiSpam: v })}
        >
          <label className="label">Nombre d'émojis max par message</label>
          <input type="number" min="1" max="50" className="input-field w-24" value={cfg.maxEmojis} onChange={e => update({ maxEmojis: Number(e.target.value) })} />
        </FeatureCard>

        <FeatureCard
          title="Mentions excessives"
          description="Détection de l'utilisation abusive de mentions."
          checked={cfg.antiMentionSpam}
          onToggle={v => update({ antiMentionSpam: v })}
        >
          <label className="label">Nombre de mentions max par message</label>
          <input type="number" min="1" max="30" className="input-field w-24" value={cfg.mentionSpamLimit} onChange={e => update({ mentionSpamLimit: Number(e.target.value) })} />
        </FeatureCard>

        <FeatureCard
          title="Pings interdits"
          description="Protège des membres/rôles précis contre les mentions."
          checked={cfg.antiPingProtection}
          onToggle={v => update({ antiPingProtection: v })}
        >
          <div>
            <label className="label mb-2">Rôles protégés</label>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggleInList('protectedRoleIds', r.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${cfg.protectedRoleIds.includes(r.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label mb-2">Membres protégés (par ID)</label>
            <div className="flex gap-2">
              <input className="input-field" placeholder="ID Discord du membre" value={userIdInput} onChange={e => setUserIdInput(e.target.value)} />
              <button
                className="btn-ghost text-sm shrink-0"
                onClick={() => { if (userIdInput.trim()) { update({ protectedUserIds: [...cfg.protectedUserIds, userIdInput.trim()] }); setUserIdInput(''); } }}
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {cfg.protectedUserIds.map((id, i) => (
                <span key={i} className="text-xs bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-2 font-mono">
                  {id}
                  <button onClick={() => update({ protectedUserIds: cfg.protectedUserIds.filter((_, idx) => idx !== i) })} className="text-white/40 hover:text-red-400">✕</button>
                </span>
              ))}
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          title="Spam de messages"
          description="Détection de l'envoi massif de messages."
          checked={cfg.antiSpam}
          onToggle={v => update({ antiSpam: v })}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Seuil (messages)</label>
              <input type="number" className="input-field" value={cfg.spamThreshold} onChange={e => update({ spamThreshold: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Intervalle (ms)</label>
              <input type="number" className="input-field" value={cfg.spamIntervalMs} onChange={e => update({ spamIntervalMs: Number(e.target.value) })} />
            </div>
          </div>
        </FeatureCard>

        <FeatureCard
          title="Markdown interdit"
          description="Détection de spoilers, titres et blocs de code abusifs."
          checked={cfg.antiMarkdown}
          onToggle={v => update({ antiMarkdown: v })}
        />
      </div>

      <div className="space-y-6 max-w-3xl">
        <div className="card p-6 space-y-3">
          <label className="label mb-0">Salons exemptés</label>
          <p className="text-[11px] text-white/30">Aucune règle d'auto-modération ne s'applique dans les salons sélectionnés.</p>
          <div className="flex flex-wrap gap-2">
            {channels.map(c => (
              <button
                key={c.id}
                onClick={() => toggleInList('ignoredChannels', c.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${cfg.ignoredChannels.includes(c.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
              >
                #{c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <label className="label mb-0">Rôles exemptés</label>
          <p className="text-[11px] text-white/30">Les membres ayant un de ces rôles ne sont jamais concernés par l'auto-modération.</p>
          <div className="flex flex-wrap gap-2">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => toggleInList('ignoredRoles', r.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${cfg.ignoredRoles.includes(r.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
              >
                {r.name}
              </button>
            ))}
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
