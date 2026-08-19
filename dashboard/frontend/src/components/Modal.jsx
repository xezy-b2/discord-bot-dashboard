export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition text-xl leading-none">✕</button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
