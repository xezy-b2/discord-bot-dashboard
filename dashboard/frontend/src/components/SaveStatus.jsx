export default function SaveStatus({ status }) {
  if (status === 'saving') return <span className="text-xs text-white/40 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-signal-400 animate-pulse" />Sauvegarde...</span>;
  if (status === 'saved') return <span className="text-xs text-green-400">✓ Sauvegardé</span>;
  if (status === 'error') return <span className="text-xs text-red-400">⚠ Échec de la sauvegarde</span>;
  return <span className="text-xs text-white/20">Sauvegarde automatique</span>;
}
