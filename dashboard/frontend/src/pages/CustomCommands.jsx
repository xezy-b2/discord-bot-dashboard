import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function CustomCommands() {
  const { guildId } = useParams();
  const [commands, setCommands] = useState([]);
  const [form, setForm] = useState({ name: '', response: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCommands(res.data.customCommands)).finally(() => setLoading(false));
  }, [guildId]);

  const add = async () => {
    if (!form.name.trim() || !form.response.trim()) return;
    const res = await api.post(`/config/${guildId}/custom-commands`, form);
    setCommands(res.data);
    setForm({ name: '', response: '' });
  };

  const remove = async (name) => {
    const res = await api.delete(`/config/${guildId}/custom-commands/${name}`);
    setCommands(res.data);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">⚡ Commandes personnalisées</h1>
        <p className="text-white/40 text-sm mt-1">Créées avec le préfixe du serveur (ex : !regles).</p>
      </div>

      <div className="card p-6 mb-6 max-w-xl space-y-4">
        <div>
          <label className="label">Nom de la commande</label>
          <input className="input-field" placeholder="regles" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Réponse</label>
          <textarea className="input-field resize-none" rows={3} value={form.response} onChange={e => setForm({ ...form, response: e.target.value })} />
        </div>
        <button onClick={add} className="btn-primary text-sm">Ajouter la commande</button>
      </div>

      {!loading && (
        <div className="space-y-3 max-w-xl">
          {commands.map(c => (
            <div key={c.name} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-signal-400 text-sm">!{c.name}</p>
                <p className="text-white/50 text-sm mt-1">{c.response}</p>
              </div>
              <button onClick={() => remove(c.name)} className="text-xs text-red-400 hover:text-red-300 shrink-0 ml-4">Supprimer</button>
            </div>
          ))}
          {commands.length === 0 && <p className="text-white/30 text-sm">Aucune commande custom pour le moment.</p>}
        </div>
      )}
    </div>
  );
}
