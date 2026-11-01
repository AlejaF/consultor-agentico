import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { createInitialState, CATALOGS } from './initial';
import { attachFlush, createPersistence, type LoadNotice, type Persistence } from './persistence';
import { reducer, type Action } from './reducer';
import type { PersistedState } from './types';

export const NOTICE_TEXT = {
  version: 'Se restableció la demo porque la versión de los datos cambió.',
  corrupt: 'Los datos guardados estaban dañados. Se restableció la demo.',
  memory: 'No se puede guardar el progreso en este navegador. Puedes seguir, pero se perderá al recargar.',
  reset: 'Se restableció la demo.',
} as const;

interface Ctx {
  state: PersistedState;
  dispatch: (a: Action) => void;
  /** Aviso transitorio de carga o restablecimiento (cerrable). */
  loadNotice: keyof typeof NOTICE_TEXT | null;
  dismissLoadNotice: () => void;
  /** Aviso permanente de modo memoria. */
  memoryMode: boolean;
  resetDemo: () => void;
}

const StateContext = createContext<Ctx | null>(null);

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem(): never {
        throw new Error('Almacenamiento no disponible');
      },
      setItem(): never {
        throw new Error('Almacenamiento no disponible');
      },
      removeItem(): never {
        throw new Error('Almacenamiento no disponible');
      },
    };
  }
}

export function StateProvider({ children }: { children: ReactNode }) {
  const [memoryMode, setMemoryMode] = useState(false);
  const persistenceRef = useRef<Persistence | null>(null);
  const loadedRef = useRef<{ state: PersistedState; notice: LoadNotice } | null>(null);
  if (persistenceRef.current === null) {
    persistenceRef.current = createPersistence({
      storage: safeStorage(),
      initialState: createInitialState,
      catalogs: CATALOGS,
      onMemoryMode: () => setMemoryMode(true),
    });
    loadedRef.current = persistenceRef.current.load();
  }
  const persistence = persistenceRef.current;

  const [state, rawDispatch] = useReducer(reducer, loadedRef.current!.state);
  const [loadNotice, setLoadNotice] = useState<Ctx['loadNotice']>(
    loadedRef.current!.notice && loadedRef.current!.notice !== 'memory' ? loadedRef.current!.notice : null,
  );

  useEffect(() => {
    if (loadedRef.current!.notice === 'memory') setMemoryMode(true);
  }, []);

  useEffect(() => {
    persistence.save(state);
  }, [state, persistence]);

  useEffect(
    () => attachFlush(window, persistence.flush, () => document.visibilityState),
    [persistence],
  );

  const resetDemo = useCallback(() => {
    rawDispatch({ type: 'reset', state: persistence.reset() });
    setLoadNotice('reset');
  }, [persistence]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      dispatch: rawDispatch,
      loadNotice,
      dismissLoadNotice: () => setLoadNotice(null),
      memoryMode,
      resetDemo,
    }),
    [state, loadNotice, memoryMode, resetDemo],
  );
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useAppState(): Ctx {
  const v = useContext(StateContext);
  if (!v) throw new Error('useAppState requiere StateProvider');
  return v;
}
