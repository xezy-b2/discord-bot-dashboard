import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-signal-500/15 border border-signal-500/30 mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">🛰️</span>
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Panneau de contrôle</h1>
        <p className="text-white/50 text-sm mb-8">
          Connecte-toi avec Discord pour configurer ton bot : bienvenue, modération, niveaux et bien plus.
        </p>
        <button onClick={login} className="btn-primary w-full flex items-center justify-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.211.375-.444.874-.608 1.267a18.27 18.27 0 0 0-5.487 0A12.6 12.6 0 0 0 9.855 3a19.74 19.74 0 0 0-3.762 1.37C3.4 8.15 2.68 11.84 3.037 15.48a19.9 19.9 0 0 0 5.993 2.98c.484-.65.914-1.34 1.283-2.06a12.7 12.7 0 0 1-2.02-.955c.17-.121.336-.248.497-.378a14.27 14.27 0 0 0 12.42 0c.163.13.328.257.497.378-.64.376-1.317.696-2.02.957.37.72.799 1.41 1.283 2.058a19.87 19.87 0 0 0 5.996-2.98c.42-4.22-.658-7.87-2.649-11.11ZM9.68 13.246c-.88 0-1.6-.804-1.6-1.79 0-.987.703-1.79 1.6-1.79.897 0 1.617.81 1.6 1.79 0 .986-.703 1.79-1.6 1.79Zm4.646 0c-.879 0-1.6-.804-1.6-1.79 0-.987.704-1.79 1.6-1.79.898 0 1.618.81 1.6 1.79 0 .986-.702 1.79-1.6 1.79Z" />
          </svg>
          Se connecter avec Discord
        </button>
      </div>
    </div>
  );
}
