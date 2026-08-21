import { NavLink, useParams } from 'react-router-dom';

const links = [
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
  { to: 'logs', label: 'Logs', icon: '📜' },
  { to: 'settings', label: 'Paramètres', icon: '⚙️' }
];

export default function Sidebar() {
  const { guildId } = useParams();

  return (
    <aside className="w-64 shrink-0 border-r border-white/5 h-screen sticky top-0 flex flex-col py-6 px-3">
      <a href="/dashboard" className="flex items-center gap-2 px-3 mb-8 shrink-0">
        <span className="text-xl">🛰️</span>
        <span className="font-display font-bold text-white/90">Panneau</span>
      </a>

      <nav className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={`/dashboard/${guildId}/${l.to}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition shrink-0 ${
                isActive ? 'bg-signal-500/15 text-signal-400 border border-signal-500/20' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pt-4 shrink-0 border-t border-white/5 mt-2">
        <a href="/dashboard" className="text-xs text-white/30 hover:text-white/60 transition">← Changer de serveur</a>
      </div>
    </aside>
  );
}
