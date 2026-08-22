import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useGuildMeta } from '../hooks/useGuildMeta';
import Toggle from '../components/Toggle';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatus from '../components/SaveStatus';

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2 bg-base-850 border border-white/10 rounded-xl px-2 py-1.5">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent" />
        <span className="text-xs text-white/50 font-mono">{value}</span>
      </div>
    </div>
  );
}

function BirthdayPreview({ guildId, cfg }) {
  const [preview, setPreview] = useState(null);
  const [rendering, setRendering] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setRendering(true);
      api.post(`/birthdays/${guildId}/preview`, cfg)
        .then(res => setPreview(res.data))
        .catch(() => {})
        .finally(() => setRendering(false));
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cfg), guildId]);

  return (
    <div className="card p-5 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <p className="label mb-0">Aperçu en direct</p>
        {rendering && <span className="text-[10px] text-signal-400 animate-pulse">Rendu en cours…</span>}
      </div>

      <div className="bg-[#313338] rounded-xl p-3 min-h-[100px]">
        <div className="flex gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-signal-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white/90">Bot<span className="ml-1 text-[9px] bg-signal-500 px-1 py-0.5 rounded text-white align-middle">BOT</span></p>
            {cfg.mode !== 'embed' && (
              <p className="text-[13px] text-white/80 whitespace-pre-wrap">{preview?.textPreview}</p>
            )}
          </div>
        </div>

        {cfg.mode === 'embed' && preview?.embedPreview && (
          <div className="border-l-4 rounded pl-3 py-2 mt-1 bg-[#2b2d31]" style={{ borderColor: preview.embedPreview.color || '#FEE75C' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {preview.embedPreview.title && <p className="text-[14px] font-semibold text-white/90 mb-1">{preview.embedPreview.title}</p>}
                <p className="text-[13px] text-white/80 whitespace-pre-wrap">{preview.embedPreview.description}</p>
              </div>
              {preview.embedPreview.thumbnail && <img src={preview.embedPreview.thumbnail} className="w-14 h-14 rounded-full shrink-0" alt="" />}
            </div>
            {preview.embedPreview.image && (
              <img src={preview.embedPreview.image} alt="" className="rounded-md w-full mt-3 max-w-md" />
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] text-white/30 mt-3">
        Utilise ton pseudo/avatar réel et ta vraie date de naissance si tu l'as enregistrée (sinon un âge d'exemple).
      </p>
    </div>
  );
}

export default function Birthdays() {
  const { guildId } = useParams();
  const { channels, roles } = useGuildMeta(guildId);
  const [cfg, setCfg] = useState(null);
  const [list, setList] = useState([]);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  useEffect(() => {
    api.get(`/birthdays/${guildId}/config`).then(res => setCfg(res.data));
    api.get(`/birthdays/${guildId}/list`).then(res => setList(res.data));
  }, [guildId]);

  const update = (patch) => setCfg(prev => ({ ...prev, ...patch }));

  const save = async () => {
    await api.patch(`/birthdays/${guildId}/config`, cfg);
  };

  const autoSaveStatus = useAutoSave(cfg, save);

  const sendTest = async () => {
    setTesting(true);
    setTestMsg('');
    try {
      await api.post(`/birthdays/${guildId}/send-test`, cfg);
      setTestMsg('✓ Test envoyé !');
    } catch (err) {
      setTestMsg(err.response?.data?.error || 'Erreur lors du test');
    } finally {
      setTesting(false);
      setTimeout(() => setTestMsg(''), 4000);
    }
  };

  const remove = async (userId) => {
    await api.delete(`/birthdays/${guildId}/${userId}`);
    setList(list.filter(b => b.userId !== userId));
  };

  if (!cfg) return <p className="text-white/40">Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">🎂 Anniversaires</h1>
          <p className="text-white/40 text-sm mt-1">
            Les membres enregistrent leur date avec <code className="text-signal-400">/anniversaire definir</code>, la consultent avec <code className="text-signal-400">/anniversaire liste</code>, et la retirent avec <code className="text-signal-400">/anniversaire retirer</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {testMsg && <span className="text-xs text-white/50">{testMsg}</span>}
          {cfg.enabled && (
            <button onClick={sendTest} disabled={testing || !cfg.channelId} className="btn-ghost text-sm">
              {testing ? 'Envoi...' : '🧪 Tester'}
            </button>
          )}
          <SaveStatus status={autoSaveStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-w-4xl mb-8">
        <div className="space-y-6">
          <div className="card p-6">
            <Toggle checked={cfg.enabled} onChange={v => update({ enabled: v })} label="Activer les annonces d'anniversaire" />
          </div>

          {cfg.enabled && (
          <>
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Salon d'annonce</label>
              <select className="input-field" value={cfg.channelId || ''} onChange={e => update({ channelId: e.target.value })}>
                <option value="">— Choisir un salon —</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Rôle à mentionner (optionnel)</label>
              <select className="input-field" value={cfg.mentionRoleId || ''} onChange={e => update({ mentionRoleId: e.target.value || null })}>
                <option value="">— Aucun —</option>
                <option value="everyone">@everyone</option>
                <option value="here">@here</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <p className="text-[11px] text-white/30 mt-1.5">Ce rôle sera notifié à chaque annonce (ex: "Fans d'anniversaires").</p>
            </div>

            <div>
              <label className="label">Heure d'envoi (UTC)</label>
              <select className="input-field" value={cfg.sendHour ?? 9} onChange={e => update({ sendHour: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <p className="text-[11px] text-white/30 mt-1.5">
                Heure exprimée en UTC (pas l'heure locale de ton pays) — décale au besoin selon ton fuseau horaire.
              </p>
            </div>

            <div>
              <label className="label">Rôle "anniversaire" du jour (optionnel, retiré automatiquement le lendemain)</label>
              <select className="input-field" value={cfg.roleId || ''} onChange={e => update({ roleId: e.target.value })}>
                <option value="">— Aucun —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <label className="label">Format</label>
            <div className="flex gap-2">
              {['text', 'embed'].map(m => (
                <button
                  key={m}
                  onClick={() => update({ mode: m })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${cfg.mode === m ? 'bg-signal-500/15 border-signal-500/40 text-signal-400' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
                >
                  {m === 'text' ? 'Texte simple' : 'Embed personnalisé'}
                </button>
              ))}
            </div>

            <div>
              <label className="label">Message (variables : {'{user}'} {'{age}'})</label>
              <input className="input-field" value={cfg.message} onChange={e => update({ message: e.target.value })} />
            </div>

            {cfg.mode === 'embed' && (
              <>
                <div>
                  <label className="label">Titre de l'embed</label>
                  <input className="input-field" value={cfg.embedTitle} onChange={e => update({ embedTitle: e.target.value })} />
                </div>

                <ColorField label="Couleur" value={cfg.embedColor} onChange={v => update({ embedColor: v })} />

                <Toggle checked={cfg.embedThumbnail} onChange={v => update({ embedThumbnail: v })} label="Afficher l'avatar du membre en miniature" />

                <div>
                  <label className="label">Image (URL, optionnel — ex: bannière d'anniversaire)</label>
                  <input className="input-field" placeholder="https://..." value={cfg.embedImageUrl} onChange={e => update({ embedImageUrl: e.target.value })} />
                </div>
              </>
            )}
          </div>
          </>
          )}
        </div>

        {cfg.enabled && <BirthdayPreview guildId={guildId} cfg={cfg} />}
      </div>

      <div className="card p-5 max-w-4xl">
        <p className="label">Anniversaires enregistrés ({list.length})</p>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {list.map(b => (
            <div key={b.userId} className="flex items-center justify-between text-sm bg-white/5 px-3 py-2 rounded-lg">
              <span className="font-mono text-xs">{b.userId}</span>
              <span className="text-white/60">{b.day} {MOIS[b.month - 1]}</span>
              <button onClick={() => remove(b.userId)} className="text-white/40 hover:text-red-400">✕</button>
            </div>
          ))}
          {list.length === 0 && <p className="text-white/30 text-sm">Aucun anniversaire enregistré.</p>}
        </div>
      </div>
    </div>
  );
}
