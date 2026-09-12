import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { initialState, restoreState } from './game';

export const STORAGE_KEY = 'banana-peeler-v1';

export function useGame() {
  const [game, setGame] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const canSave = useRef(false);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!mounted) return;
        setGame(restoreState(saved));
        canSave.current = true;
      })
      .catch(() => { if (mounted) setStorageError(true); })
      .finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready || !canSave.current) return;
    const snapshot = JSON.stringify(game);
    // Serialize writes so an earlier save cannot replace newer progress.
    writes.current = writes.current
      .then(() => AsyncStorage.setItem(STORAGE_KEY, snapshot))
      .then(() => setStorageError(false))
      .catch(() => setStorageError(true));
  }, [game, ready]);

  useEffect(() => {
    if (!ready) return;
    let active = AppState.currentState === 'active';
    const subscription = AppState.addEventListener('change', (state) => { active = state === 'active'; });
    const timer = setInterval(() => {
      if (active) setGame((state) => ({ ...state, activeSeconds: state.activeSeconds + 1 }));
    }, 1000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [ready]);

  return { game, setGame, ready, storageError };
}
