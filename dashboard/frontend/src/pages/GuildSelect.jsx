import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

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
            disabled={!g.botPresent}
            onClick={() => navigate(`/dashboard/${g.id}/welcome`)}
            className={`card p-5 text-left flex items-center gap-4 transition hover:border-signal-500/40 ${!g.botPresent ? 'opacity-40 cursor-not-allowed' : ''}`}
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
              <p className="text-xs text-white/40">{g.botPresent ? 'Bot présent' : 'Bot non invité'}</p>
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
