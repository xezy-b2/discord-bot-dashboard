import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

export default function LivePreview({ guildId, type, cfg }) {
  const [image, setImage] = useState(null);
  const [textPreview, setTextPreview] = useState('');
  const [embedPreview, setEmbedPreview] = useState(null);
  const [rendering, setRendering] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setRendering(true);
      api.post(`/preview/${guildId}/${type}`, cfg)
        .then(res => {
          setImage(res.data.image || null);
          setTextPreview(res.data.textPreview || '');
          setEmbedPreview(res.data.embedPreview || null);
        })
        .catch(() => {})
        .finally(() => setRendering(false));
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cfg), guildId, type]);

  return (
    <div className="card p-5 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <p className="label mb-0">Aperçu en direct</p>
        {rendering && <span className="text-[10px] text-signal-400 animate-pulse">Rendu en cours…</span>}
      </div>

      <div className="bg-[#313338] rounded-xl p-3 min-h-[120px]">
        <div className="flex gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-signal-500 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-white/90">Ambri.Bot<span className="ml-1 text-[9px] bg-signal-500 px-1 py-0.5 rounded text-white align-middle">BOT</span></p>
            {(cfg.mode === 'embed') ? null : (
              <p className="text-[13px] text-white/80 whitespace-pre-wrap">{textPreview}</p>
            )}
          </div>
        </div>

        {image && (cfg.mode === 'image' || cfg.mode === 'both') && (
          <img src={image} alt="preview" className="rounded-lg w-full mt-1" />
        )}

        {embedPreview && (cfg.mode === 'embed' || cfg.mode === 'both') && (
          <div className="border-l-4 rounded pl-3 py-2 mt-2 bg-[#2b2d31]" style={{ borderColor: embedPreview.color || '#5865F2' }}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] text-white/80 whitespace-pre-wrap">{embedPreview.description}</p>
              {embedPreview.thumbnail && <img src={embedPreview.thumbnail} className="w-14 h-14 rounded-full shrink-0" alt="" />}
            </div>
            {embedPreview.image && (
              <img src={embedPreview.image} alt="" className="rounded-md w-full mt-3 max-w-md" />
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] text-white/30 mt-3">
        Cet aperçu utilise ton pseudo/avatar Discord réel — c'est exactement ce que verront tes membres.
      </p>
    </div>
  );
}
