import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import Toggle from '../components/Toggle';

export default function Economy() {
  const { guildId } = useParams();
  const [cfg, setCfg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/config/${guildId}`).then(res => setCfg(res.data.economy));
  }, [guildId]);

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));

  const save = async () => {
    setSaving(true);
    await api.patch(`/config/${guildId}/economy`, cfg);
    setSaving(false);
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🪙 Économie</h1>
          <p className="text-white/40 text-sm mt-1">Monnaie virtuelle du serveur.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary text-sm">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
      </div>

      <div className="space-y-6 max-w-xl">
        <div className="card p-6">
          <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer l'économie" />
        </div>

        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom de la monnaie</label>
              <input className="input-field" value={cfg.currencyName} onChange={e => update({ currencyName: e.target.value })} />
            </div>
            <div>
              <label className="label">Symbole / emoji</label>
              <input className="input-field" value={cfg.currencySymbol} onChange={e => update({ currencySymbol: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Montant du /daily</label>
            <input type="number" className="input-field" value={cfg.dailyAmount} onChange={e => update({ dailyAmount: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">/work min</label>
              <input type="number" className="input-field" value={cfg.workMin} onChange={e => update({ workMin: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">/work max</label>
              <input type="number" className="input-field" value={cfg.workMax} onChange={e => update({ workMax: Number(e.target.value) })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
