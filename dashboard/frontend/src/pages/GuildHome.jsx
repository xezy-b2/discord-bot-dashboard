import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

const SHORTCUTS = [
  { to: 'welcome', label: 'Bienvenue', icon: '👋' },
  { to: 'leave', label: 'Départ', icon: '🚪' },
  { to: 'auto-roles', label: 'Rôles automatiques', icon: '🏷️' },
  { to: 'automod', label: 'Auto-modération', icon: '🛡️' },
  { to: 'moderation', label: 'Sanctions', icon: '🔨' },
  { to: 'leveling', label: 'Niveaux & XP', icon: '📈' },
  { to: 'reaction-roles', label: 'Rôles à réaction', icon: '🎭' },
  { to: 'tickets', label: 'Tickets', icon: '🎫' },
  { to: 'recurring-messages', label: 'Messages récurrents', icon: '🔁' },
  { to: 'birthdays', label: 'Anniversaires', icon: '🎂' },
  { to: 'social-notifications', label: 'Notifications sociales', icon: '📡' },
  { to: 'economy', label: 'Économie', icon: '🪙' },
  { to: 'commands', label: 'Commandes custom', icon: '⚡' },
  { to: 'logs', label: 'Logs', icon: '📜' }
];

export default function GuildHome() {
  const { guildId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/guilds/${guildId}/info`).then(res => setInfo(res.data)).finally(() => setLoading(false));
  }, [guildId]);

  const iconUrl = info?.icon
    ? `https://cdn.discordapp.com/icons/${guildId}/${info.icon}.png?size=128`
    : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        {iconUrl ? (
          <img src={iconUrl} alt="" className="w-16 h-16 rounded-2xl" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-base-800 flex items-center justify-center font-display font-bold text-white/60 text-xl">
            {info?.name?.slice(0, 2).toUpperCase() || '?'}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold">{loading ? 'Chargement...' : info?.name}</h1>
          <p className="text-white/40 text-sm mt-1">Vue d'ensemble du serveur</p>
        </div>
      </div>

      {!loading && info && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="card p-5">
            <p className="text-2xl font-display font-bold text-signal-400">{info.approximate_member_count ?? '—'}</p>
            <p className="text-xs text-white/40 mt-1">Membres</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-display font-bold text-green-400">{info.approximate_presence_count ?? '—'}</p>
            <p className="text-xs text-white/40 mt-1">En ligne</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-display font-bold text-ember-400">Niveau {info.premium_tier ?? 0}</p>
            <p className="text-xs text-white/40 mt-1">{info.premium_subscription_count ?? 0} boosts</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-display font-bold text-white/70">{new Date(Number(BigInt(guildId) >> 22n) + 1420070400000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })}</p>
            <p className="text-xs text-white/40 mt-1">Serveur créé le</p>
          </div>
        </div>
      )}

      <p className="label mb-3">Accès rapide</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {SHORTCUTS.map(s => (
          <Link
            key={s.to}
            to={`/dashboard/${guildId}/${s.to}`}
            className="card p-4 flex items-center gap-3 hover:border-signal-500/40 transition"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm font-medium text-white/80">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
