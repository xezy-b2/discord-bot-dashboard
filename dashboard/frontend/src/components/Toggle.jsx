export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      {label && <span className="text-sm text-white/70">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition ${checked ? 'bg-signal-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}
