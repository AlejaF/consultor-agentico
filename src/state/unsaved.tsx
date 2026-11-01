import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';

interface Ctx {
  setDirty: (key: string, dirty: boolean) => void;
  hasUnsaved: () => boolean;
}

const UnsavedContext = createContext<Ctx | null>(null);

/** Registro de ediciones sin guardar, para pedir confirmación antes de cambiar de rol. */
export function UnsavedProvider({ children }: { children: ReactNode }) {
  const keys = useRef(new Set<string>());
  const setDirty = useCallback((key: string, dirty: boolean) => {
    if (dirty) keys.current.add(key);
    else keys.current.delete(key);
  }, []);
  const hasUnsaved = useCallback(() => keys.current.size > 0, []);
  return <UnsavedContext.Provider value={{ setDirty, hasUnsaved }}>{children}</UnsavedContext.Provider>;
}

export function useUnsaved(): Ctx {
  const v = useContext(UnsavedContext);
  if (!v) throw new Error('useUnsaved requiere UnsavedProvider');
  return v;
}

/** Marca esta edición como sin guardar mientras `dirty` sea verdadero. */
export function useDirtyFlag(key: string, dirty: boolean) {
  const { setDirty } = useUnsaved();
  useEffect(() => {
    setDirty(key, dirty);
    return () => setDirty(key, false);
  }, [key, dirty, setDirty]);
}
