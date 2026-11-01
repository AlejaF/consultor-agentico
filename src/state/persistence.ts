import type { Role } from '../app/router';
import { SCHEMA_VERSION, type Catalogs, type PersistedState } from './types';

export const STORAGE_KEY = 'consultor-agentico-demo:state';
export const FLUSH_DELAY_MS = 200;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadNotice = 'version' | 'corrupt' | 'memory' | null;

export interface LoadResult {
  state: PersistedState;
  notice: LoadNotice;
}

export interface PersistenceOptions {
  storage: StorageLike;
  initialState: () => PersistedState;
  catalogs: Catalogs;
  onMemoryMode?: () => void;
  delayMs?: number;
}

const ROLES: readonly string[] = ['consultor', 'lider', 'contacto'] satisfies Role[];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

/** Solo nombre, tipo y tamaño de los archivos propios: nunca su contenido (FR-006). */
function sanitize(state: PersistedState): PersistedState {
  const projects: PersistedState['projects'] = {};
  for (const [id, p] of Object.entries(state.projects)) {
    projects[id] = {
      ...p,
      localFiles: p.localFiles.map(({ id: fid, name, type, size, addedAt }) => ({ id: fid, name, type, size, addedAt })),
    };
  }
  return { ...state, projects };
}

function validProject(p: unknown, c: Catalogs): boolean {
  if (!isObj(p)) return false;
  if (!isObj(p.answers) || !Object.values(p.answers).every(isStr)) return false;
  if (!Array.isArray(p.localFiles)) return false;
  for (const f of p.localFiles) {
    if (!isObj(f) || !isStr(f.id) || !isStr(f.name) || !isStr(f.type) || !isStr(f.addedAt)) return false;
    if (typeof f.size !== 'number' || f.size < 0) return false;
  }
  const d = p.diagnosis;
  if (!isObj(d) || !['none', 'generated', 'issued'].includes(d.status as string)) return false;
  if (!isObj(d.decisions)) return false;
  for (const [fid, dec] of Object.entries(d.decisions)) {
    if (!c.findingIds.includes(fid) || !isObj(dec)) return false;
    if (dec.state === 'edited') {
      if (!isStr(dec.text) || dec.text.trim() === '') return false;
    } else if (!['pending', 'accepted', 'rejected'].includes(dec.state as string)) return false;
  }
  const s = p.strategy;
  return isObj(s) && ['none', 'generated', 'sent'].includes(s.status as string);
}

/** Valida la forma de un estado ya decodificado (contracts/persisted-state.md, paso 5). */
export function isValidShape(raw: unknown, c: Catalogs): raw is PersistedState {
  if (!isObj(raw)) return false;
  if (!isObj(raw.session) || !(raw.session.role === null || ROLES.includes(raw.session.role as string))) return false;
  if (!isObj(raw.projects)) return false;
  for (const id of c.projectIds) if (!(id in raw.projects)) return false;
  for (const [id, p] of Object.entries(raw.projects)) {
    if (!c.projectIds.includes(id) || !validProject(p, c)) return false;
  }
  if (!isObj(raw.gradings)) return false;
  for (const [key, g] of Object.entries(raw.gradings)) {
    const m = key.match(/^(dx|st)\/(.+)$/);
    if (!m || !c.projectIds.includes(m[2]) || !isObj(g) || !isObj(g.levels)) return false;
    for (const [cid, lv] of Object.entries(g.levels)) {
      if (!c.criterionIds.includes(cid) || !Number.isInteger(lv) || (lv as number) < 1 || (lv as number) > 5) return false;
    }
    if (!isStr(g.comment) || typeof g.average !== 'number' || !isStr(g.gradedAt)) return false;
  }
  if (!isObj(raw.surveys)) return false;
  for (const [id, s] of Object.entries(raw.surveys)) {
    if (!c.projectIds.includes(id) || !isObj(s) || !isObj(s.answers)) return false;
  }
  if (!Array.isArray(raw.activity) || raw.activity.length > 50) return false;
  return raw.activity.every((a) => isObj(a) && isStr(a.at) && isStr(a.text));
}

export function createPersistence(opts: PersistenceOptions) {
  const { storage, initialState, catalogs, onMemoryMode } = opts;
  const delay = opts.delayMs ?? FLUSH_DELAY_MS;
  let memory = false;
  let pending: PersistedState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function enterMemoryMode() {
    if (!memory) {
      memory = true;
      onMemoryMode?.();
    }
  }

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function write() {
    clearTimer();
    if (pending === null || memory) {
      pending = null;
      return;
    }
    const json = JSON.stringify(sanitize(pending));
    pending = null;
    try {
      storage.setItem(STORAGE_KEY, json);
    } catch {
      enterMemoryMode();
    }
  }

  return {
    load(): LoadResult {
      let text: string | null;
      try {
        text = storage.getItem(STORAGE_KEY);
      } catch {
        enterMemoryMode();
        return { state: initialState(), notice: 'memory' };
      }
      if (text === null) return { state: initialState(), notice: null };
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        return { state: initialState(), notice: 'corrupt' };
      }
      if (isObj(raw) && raw.schemaVersion !== SCHEMA_VERSION) return { state: initialState(), notice: 'version' };
      if (!isValidShape(raw, catalogs)) return { state: initialState(), notice: 'corrupt' };
      return { state: sanitize(raw), notice: null };
    },
    /** Programa el guardado con retraso; ráfagas dentro del plazo se agrupan. */
    save(state: PersistedState): void {
      if (memory) return;
      pending = state;
      clearTimer();
      timer = setTimeout(write, delay);
    },
    /** Guardado inmediato; idempotente y sin efecto sin cambios pendientes. */
    flush(): void {
      write();
    },
    reset(): PersistedState {
      clearTimer();
      pending = null;
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {
        enterMemoryMode();
      }
      return initialState();
    },
    isMemoryMode: () => memory,
  };
}

export type Persistence = ReturnType<typeof createPersistence>;

export interface FlushTarget {
  addEventListener(type: string, handler: () => void): void;
  removeEventListener(type: string, handler: () => void): void;
}

/** Registra pagehide y visibilitychange (este solo si la página queda oculta). */
export function attachFlush(
  target: FlushTarget,
  flush: () => void,
  getVisibility: () => 'hidden' | 'visible' | string,
): () => void {
  const onHide = () => flush();
  const onVisibility = () => {
    if (getVisibility() === 'hidden') flush();
  };
  target.addEventListener('pagehide', onHide);
  target.addEventListener('visibilitychange', onVisibility);
  return () => {
    target.removeEventListener('pagehide', onHide);
    target.removeEventListener('visibilitychange', onVisibility);
  };
}
