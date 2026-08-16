import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

export default function CardPreview({ guildId, type, cfg, note }) {
  const [image, setImage] = useState(null);
  const [rendering, setRendering] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setRendering(true);
      api.post(`/preview/${guildId}/${type}`, cfg)
        .then(res => setImage(res.data.image || null))
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

      <div className="bg-[#313338] rounded-xl p-3 min-h-[120px] flex items-center justify-center">
        {image ? (
          <img src={image} alt="preview" className="rounded-lg w-full" />
        ) : (
          <p className="text-white/20 text-sm py-8">Chargement...</p>
        )}
      </div>

      <p className="text-[11px] text-white/30 mt-3">{note || 'Aperçu généré avec ton pseudo/avatar Discord réel.'}</p>
    </div>
  );
}
