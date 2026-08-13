import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

// Permissions par defaut proposees a l'invitation (Administrateur, pratique en test).
// Affine ce nombre si tu veux limiter les droits du bot des l'invitation.
const DEFAULT_PERMISSIONS = '8';

function inviteUrl(guildId) {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    scope: 'bot applications.commands',
    permissions: DEFAULT_PERMISSIONS,
    guild_id: guildId,
    disable_guild_select: 'true'
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export default function GuildSelect() {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/guilds').then(res => setGuilds(res.data)).finally(() => setLoading(false));
  }, []);

  const iconUrl = (g) => g.icon
    ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
    : null;

  const handleClick = (g) => {
    if (g.botPresent) {
      navigate(`/dashboard/${g.id}/welcome`);
    } else {
      window.open(inviteUrl(g.id), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen px-6 py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl font-bold">Tes serveurs</h1>
          <p className="text-white/40 text-sm mt-1">Choisis un serveur à configurer.</p>
        </div>
        <button onClick={logout} className="btn-ghost text-sm">Déconnexion</button>
      </div>

      {loading && <p className="text-white/40">Chargement...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {guilds.map(g => (
          <button
            key={g.id}
            onClick={() => handleClick(g)}
            className={`card p-5 text-left flex items-center gap-4 transition hover:border-signal-500/40 group ${!g.botPresent ? 'opacity-70 hover:opacity-100' : ''}`}
          >
            {iconUrl(g) ? (
              <img src={iconUrl(g)} alt="" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-base-800 flex items-center justify-center font-display font-bold text-white/60">
                {g.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{g.name}</p>
              {g.botPresent ? (
                <p className="text-xs text-white/40">Bot présent</p>
              ) : (
                <p className="text-xs text-signal-400 group-hover:underline">+ Inviter le bot ici</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {!loading && guilds.length === 0 && (
        <p className="text-white/40 mt-10">Aucun serveur où tu as les droits de gestion.</p>
      )}
    </div>
  );
}
