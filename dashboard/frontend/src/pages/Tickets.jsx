import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatus from '../components/SaveStatus';

export default function Tickets() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [categories, setCategories] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [panelForm, setPanelForm] = useState({ channelId: '', title: '🎫 Support', description: 'Clique sur le bouton ci-dessous pour ouvrir un ticket.', buttonLabel: 'Créer un ticket' });
  const [creatingPanel, setCreatingPanel] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/tickets/${guildId}/config`).then(res => setCfg(res.data));
    api.get(`/tickets/${guildId}/list`).then(res => setTickets(res.data));
    api.get(`/guilds/${guildId}/categories`).then(res => setCategories(res.data));
  }, [guildId]);

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));

  const save = async () => {
    await api.patch(`/tickets/${guildId}/config`, cfg);
  };

  const autoSaveStatus = useAutoSave(cfg, save);

  const createPanel = async () => {
    if (!panelForm.channelId) return;
    setCreatingPanel(true);
    setError('');
    try {
      const res = await api.post(`/tickets/${guildId}/panel`, panelForm);
      setCfg(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du panneau');
    } finally {
      setCreatingPanel(false);
    }
  };

  const toggleSupportRole = (roleId) => {
    const current = cfg.supportRoleIds || [];
    update({ supportRoleIds: current.includes(roleId) ? current.filter(id => id !== roleId) : [...current, roleId] });
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🎫 Tickets</h1>
          <p className="text-white/40 text-sm mt-1">Support par ticket avec transcription HTML automatique à la fermeture.</p>
        </div>
        <SaveStatus status={autoSaveStatus} />
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <div className="space-y-6">
          <div className="card p-6">
            <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer le système de tickets" />
          </div>

          {cfg.enabled && (
          <>
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Catégorie des tickets</label>
              <select className="input-field" value={cfg.categoryId || ''} onChange={e => update({ categoryId: e.target.value })}>
                <option value="">— Choisir une catégorie —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Salon des transcriptions</label>
              <select className="input-field" value={cfg.transcriptChannelId || ''} onChange={e => update({ transcriptChannelId: e.target.value })}>
                <option value="">— Choisir un salon —</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Message d'accueil dans le ticket</label>
              <textarea className="input-field resize-none" rows={2} value={cfg.welcomeMessage} onChange={e => update({ welcomeMessage: e.target.value })} />
            </div>

            <div>
              <label className="label">Tickets max ouverts par membre</label>
              <input type="number" className="input-field w-24" min="1" max="10" value={cfg.maxOpenPerUser} onChange={e => update({ maxOpenPerUser: Number(e.target.value) })} />
            </div>

            <div>
              <label className="label mb-2">Rôles support (voient et gèrent tous les tickets)</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => toggleSupportRole(r.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${cfg.supportRoleIds?.includes(r.id) ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <p className="label mb-0">Panneau d'ouverture (message avec le bouton)</p>
            <select className="input-field" value={panelForm.channelId} onChange={e => setPanelForm({ ...panelForm, channelId: e.target.value })}>
              <option value="">— Salon de publication —</option>
              {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
            <input className="input-field" value={panelForm.title} onChange={e => setPanelForm({ ...panelForm, title: e.target.value })} placeholder="Titre" />
            <textarea className="input-field resize-none" rows={2} value={panelForm.description} onChange={e => setPanelForm({ ...panelForm, description: e.target.value })} placeholder="Description" />
            <input className="input-field" value={panelForm.buttonLabel} onChange={e => setPanelForm({ ...panelForm, buttonLabel: e.target.value })} placeholder="Texte du bouton" />
            <button onClick={createPanel} disabled={creatingPanel} className="btn-primary text-sm">
              {creatingPanel ? 'Publication...' : cfg.panelMessageId ? 'Republier le panneau' : 'Publier le panneau'}
            </button>
            {cfg.panelMessageId && <p className="text-[11px] text-white/30">✓ Panneau actif dans #{channels.find(c => c.id === cfg.panelChannelId)?.name}</p>}
          </div>
          </>
          )}
        </div>

        <div className="card p-5">
          <p className="label">Tickets récents</p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {tickets.map(t => (
              <div key={t._id} className="text-sm bg-white/5 px-3 py-2 rounded-lg flex items-center justify-between">
                <span>
                  <span className={t.status === 'open' ? 'text-green-400' : 'text-white/40'}>{t.status === 'open' ? '● Ouvert' : '○ Fermé'}</span>
                  {' — '}<span className="font-mono text-xs">{t.userId}</span>
                </span>
                <span className="text-xs text-white/30">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-white/30 text-sm">Aucun ticket pour le moment.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
