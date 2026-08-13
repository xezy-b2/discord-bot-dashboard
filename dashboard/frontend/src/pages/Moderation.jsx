import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function Moderation() {
  const { guildId } = useParams();
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/moderation/${guildId}/warnings`).then(res => setWarnings(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [guildId]);

  const remove = async (id) => {
    await api.delete(`/moderation/${guildId}/warnings/${id}`);
    setWarnings(warnings.filter(w => w._id !== id));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">🔨 Sanctions</h1>
        <p className="text-white/40 text-sm mt-1">Historique des avertissements donnés via /warn.</p>
      </div>

      {loading && <p className="text-white/40">Chargement...</p>}

      {!loading && warnings.length === 0 && (
        <p className="text-white/40">Aucun avertissement pour le moment.</p>
      )}

      <div className="space-y-3">
        {warnings.map(w => (
          <div key={w._id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm">
                <span className="font-mono text-white/50">{w.userId}</span> — {w.reason}
              </p>
              <p className="text-xs text-white/30 mt-1">
                Par {w.moderatorId} · {new Date(w.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>
            <button onClick={() => remove(w._id)} className="text-xs text-red-400 hover:text-red-300">Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
}
