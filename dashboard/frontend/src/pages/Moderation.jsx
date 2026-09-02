import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function Moderation() {
  const { guildId } = useParams();
  const [warnings, setWarnings] = useState([]);
  const [bans, setBans] = useState([]);
  const [loadingWarnings, setLoadingWarnings] = useState(true);
  const [loadingBans, setLoadingBans] = useState(true);
  const [bansError, setBansError] = useState('');
  const [unbanningId, setUnbanningId] = useState(null);

  const loadWarnings = () => {
    setLoadingWarnings(true);
    api.get(`/moderation/${guildId}/warnings`).then(res => setWarnings(res.data)).finally(() => setLoadingWarnings(false));
  };

  const loadBans = () => {
    setLoadingBans(true);
    setBansError('');
    api.get(`/moderation/${guildId}/bans`)
      .then(res => setBans(res.data))
      .catch(err => setBansError(err.response?.data?.error || 'Erreur lors du chargement des bannis'))
      .finally(() => setLoadingBans(false));
  };

  useEffect(() => { loadWarnings(); loadBans(); }, [guildId]);

  const removeWarning = async (id) => {
    await api.delete(`/moderation/${guildId}/warnings/${id}`);
    setWarnings(warnings.filter(w => w._id !== id));
  };

  const unban = async (userId) => {
    setUnbanningId(userId);
    try {
      await api.delete(`/moderation/${guildId}/bans/${userId}`);
      setBans(bans.filter(b => b.user.id !== userId));
    } catch (err) {
      setBansError(err.response?.data?.error || 'Erreur lors du débannissement');
    } finally {
      setUnbanningId(null);
    }
  };

  const avatarUrl = (user) => user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.id.slice(-1)) % 5}.png`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">🔨 Sanctions</h1>
        <p className="text-white/40 text-sm mt-1">Avertissements donnés via /warn, et membres actuellement bannis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        {/* --- Avertissements --- */}
        <div>
          <p className="label mb-3">⚠️ Avertissements</p>

          {loadingWarnings && <p className="text-white/40 text-sm">Chargement...</p>}
          {!loadingWarnings && warnings.length === 0 && (
            <p className="text-white/30 text-sm">Aucun avertissement pour le moment.</p>
          )}

          <div className="space-y-3">
            {warnings.map(w => (
              <div key={w._id} className="card p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-mono text-white/50">{w.userId}</span> — {w.reason}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Par {w.moderatorId} · {new Date(w.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button onClick={() => removeWarning(w._id)} className="text-xs text-red-400 hover:text-red-300 shrink-0 ml-3">Supprimer</button>
              </div>
            ))}
          </div>
        </div>

        {/* --- Membres bannis --- */}
        <div>
          <p className="label mb-3">🚫 Membres bannis ({bans.length})</p>

          {bansError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-3">
              {bansError}
            </div>
          )}

          {loadingBans && <p className="text-white/40 text-sm">Chargement...</p>}
          {!loadingBans && !bansError && bans.length === 0 && (
            <p className="text-white/30 text-sm">Aucun membre banni actuellement.</p>
          )}

          <div className="space-y-3">
            {bans.map(({ user, reason }) => (
              <div key={user.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={avatarUrl(user)} alt="" className="w-9 h-9 rounded-full shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.username}</p>
                    <p className="text-xs text-white/40 truncate">{reason || 'Aucune raison enregistrée'}</p>
                  </div>
                </div>
                <button
                  onClick={() => unban(user.id)}
                  disabled={unbanningId === user.id}
                  className="text-xs text-signal-400 hover:text-signal-300 shrink-0"
                >
                  {unbanningId === user.id ? '...' : 'Débannir'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
