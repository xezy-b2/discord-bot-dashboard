import { useEffect, useRef, useState } from 'react';

/**
 * Sauvegarde automatiquement `value` (debounce) via `saveFn` a chaque changement,
 * sans jamais sauvegarder au tout premier rendu (chargement initial depuis l'API).
 * @param {any} value - l'etat a surveiller (sera compare via JSON.stringify)
 * @param {() => Promise<any>} saveFn - fonction de sauvegarde (doit lire l'etat courant via closure)
 * @param {number} delay - delai de debounce en ms
 * @returns {'idle'|'saving'|'saved'|'error'}
 */
export function useAutoSave(value, saveFn, delay = 1200) {
  const [status, setStatus] = useState('idle');
  const firstRun = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (value == null) return;

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setStatus('idle');
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await saveFn();
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (err) {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, delay);

    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  return status;
}
