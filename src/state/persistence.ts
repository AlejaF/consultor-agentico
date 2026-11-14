import type { Role } from '../app/router';
import { clip } from '../providers/real';
import { SCHEMA_VERSION, type Catalogs, type MissingInfo, type PersistedState, type ProjectState, type RealCitation, type RealFinding, type RealState, type TraceSummary } from './types';

export const STORAGE_KEY = 'consultor-agentico-demo:state';
export const FLUSH_DELAY_MS = 200;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadNotice = 'version' | 'corrupt' | 'memory' | 'dropped' | null;

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

const DIMS: readonly string[] = ['estrategia', 'infraestructura', 'datos', 'gobernanza', 'talento', 'cultura'];
const MAX_QUOTE = 2000;
const MAX_MISSING = 400;

function validLocation(l: unknown): boolean {
  if (!isObj(l)) return false;
  switch (l.kind) {
    case 'page': return typeof l.page === 'number';
    case 'paragraph': case 'line': return typeof l.n === 'number';
    case 'sheet': return isStr(l.sheet) && typeof l.row === 'number';
    case 'time': return isStr(l.start);
    default: return false;
  }
}

function validCitation(c: unknown): c is RealCitation {
  return isObj(c) && isStr(c.file) && isStr(c.quote) && typeof c.verified === 'boolean' && validLocation(c.location);
}

function validRealFinding(f: unknown): f is RealFinding {
  return isObj(f) && isStr(f.id) && /^R\d+$/.test(f.id) && isStr(f.dimension) && DIMS.includes(f.dimension) && isStr(f.title) && isStr(f.text) &&
    typeof f.verified === 'boolean' && (f.unverifiedReason === undefined || isStr(f.unverifiedReason)) && Array.isArray(f.citations) && f.citations.every(validCitation);
}

function validMissing(m: unknown): m is MissingInfo {
  return isObj(m) && isStr(m.dimension) && DIMS.includes(m.dimension) && isStr(m.description) && m.description.length <= MAX_MISSING;
}

function validRun(r: unknown): r is TraceSummary {
  return isObj(r) && isStr(r.model) && isObj(r.tokens) && typeof r.iterations === 'number' && Array.isArray(r.steps) && Array.isArray(r.errors) && isObj(r.toolCounts);
}

/** Deja solo lo permitido de lo real: el fragmento citado (acotado) y la traza con argumentos recortados; nunca el texto completo (AG-025). */
function sanitizeReal(r: RealState): RealState {
  return {
    findings: r.findings.map((f) => ({
      id: f.id, dimension: f.dimension, title: f.title, text: f.text, verified: f.verified,
      ...(f.unverifiedReason !== undefined ? { unverifiedReason: f.unverifiedReason } : {}),
      citations: f.citations.map((c) => ({ file: c.file, location: c.location, quote: c.quote.slice(0, MAX_QUOTE), verified: c.verified })),
      origin: 'agent' as const,
    })),
    missingInfo: r.missingInfo.map((m) => ({ dimension: m.dimension, description: m.description.slice(0, MAX_MISSING) })),
    objections: [],
    ...(r.diagnosisRun ? { diagnosisRun: { ...r.diagnosisRun, steps: r.diagnosisRun.steps.map((st) => (st.type === 'tool' ? { ...st, args: clip(st.args) } : st)) } } : {}),
  };
}

/** Solo nombre, tipo y tamaño de los archivos propios: nunca su contenido (FR-006). */
function sanitize(state: PersistedState): PersistedState {
  const projects: PersistedState['projects'] = {};
  for (const [id, p] of Object.entries(state.projects)) {
    const out: ProjectState = {
      ...p,
      localFiles: p.localFiles.map(({ id: fid, name, type, size, addedAt }) => ({ id: fid, name, type, size, addedAt })),
    };
    if (p.serverFiles) out.serverFiles = p.serverFiles.map(({ id: fid, name, type, size }) => ({ id: fid, name, type, size }));
    if (p.real) out.real = sanitizeReal(p.real);
    projects[id] = out;
  }
  return { ...state, projects };
}

/**
 * Hallazgos reales con forma inválida se descartan UNO A UNO (con aviso) y sus decisiones con ellos; la información faltante
 * inválida también. Devuelve cuántos elementos se descartaron. Trabaja sobre un valor ya decodificado de JSON.
 */
function dropInvalidReal(raw: Obj): number {
  let dropped = 0;
  if (!isObj(raw.projects)) return 0;
  for (const p of Object.values(raw.projects)) {
    if (!isObj(p) || !isObj(p.real)) continue;
    const real = p.real;
    if (Array.isArray(real.findings)) {
      const list: unknown[] = real.findings;
      const kept = list.filter(validRealFinding);
      dropped += list.length - kept.length;
      real.findings = kept;
      // La decisión de un hallazgo descartado se va con él; una decisión con un id que nunca existió sigue siendo un estado dañado.
      if (p.mode === 'real' && isObj(p.diagnosis) && isObj(p.diagnosis.decisions)) {
        const decisions = p.diagnosis.decisions as Record<string, unknown>;
        for (const bad of list.filter((x) => !validRealFinding(x))) if (isObj(bad) && isStr(bad.id)) delete decisions[bad.id];
      }
    }
    if (Array.isArray(real.missingInfo)) {
      const list: unknown[] = real.missingInfo;
      const kept = list.filter(validMissing);
      dropped += list.length - kept.length;
      real.missingInfo = kept;
    }
    if (real.diagnosisRun !== undefined && !validRun(real.diagnosisRun)) {
      delete real.diagnosisRun;
      dropped += 1;
    }
  }
  return dropped;
}

function validProject(p: unknown, c: Catalogs): boolean {
  if (!isObj(p)) return false;
  if (!isObj(p.answers) || !Object.values(p.answers).every(isStr)) return false;
  if (!Array.isArray(p.localFiles)) return false;
  for (const f of p.localFiles) {
    if (!isObj(f) || !isStr(f.id) || !isStr(f.name) || !isStr(f.type) || !isStr(f.addedAt)) return false;
    if (typeof f.size !== 'number' || f.size < 0) return false;
  }
  if (p.mode !== undefined && p.mode !== 'simulated' && p.mode !== 'real') return false;
  if (p.serverFiles !== undefined) {
    if (!Array.isArray(p.serverFiles)) return false;
    for (const f of p.serverFiles) if (!isObj(f) || !isStr(f.id) || !isStr(f.name) || !isStr(f.type) || typeof f.size !== 'number') return false;
  }
  if (p.real !== undefined) {
    // Un hallazgo inválido ya se descartó antes (dropInvalidReal); aquí la forma de lo que queda debe ser exacta.
    if (!isObj(p.real) || !Array.isArray(p.real.findings) || !p.real.findings.every(validRealFinding)) return false;
    if (!Array.isArray(p.real.missingInfo) || !p.real.missingInfo.every(validMissing)) return false;
    if (p.real.diagnosisRun !== undefined && !validRun(p.real.diagnosisRun)) return false;
  }
  // En modo real los ids de las decisiones son los de `real.findings` (dinámicos); en Simulado, los fijos de la plantilla.
  const validIds: readonly string[] = p.mode === 'real' ? (isObj(p.real) && Array.isArray(p.real.findings) ? (p.real.findings as RealFinding[]).map((f) => f.id) : []) : c.findingIds;
  const d = p.diagnosis;
  if (!isObj(d) || !['none', 'generated', 'issued'].includes(d.status as string)) return false;
  if (!isObj(d.decisions)) return false;
  for (const [fid, dec] of Object.entries(d.decisions)) {
    if (!validIds.includes(fid) || !isObj(dec)) return false;
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
      const v = isObj(raw) ? raw.schemaVersion : undefined;
      // v2 → v3 sin pérdida: cada proyecto recibe `mode: 'simulated'` y `serverFiles: []`; nada más cambia.
      if (isObj(raw) && v === 2) {
        if (!isValidShape({ ...raw, schemaVersion: SCHEMA_VERSION }, catalogs)) return { state: initialState(), notice: 'corrupt' };
        const projects = Object.fromEntries(Object.entries((raw as unknown as PersistedState).projects).map(([id, p]) => [id, { ...p, mode: 'simulated' as const, serverFiles: [] }]));
        return { state: sanitize({ ...(raw as unknown as PersistedState), schemaVersion: SCHEMA_VERSION, projects }), notice: null };
      }
      if (isObj(raw) && v !== SCHEMA_VERSION) return { state: initialState(), notice: 'version' };
      const dropped = isObj(raw) ? dropInvalidReal(raw) : 0;
      if (!isValidShape(raw, catalogs)) return { state: initialState(), notice: 'corrupt' };
      return { state: sanitize(raw), notice: dropped > 0 ? 'dropped' : null };
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
    /**
     * Adopta lo que hay ahora en el almacenamiento (p. ej. tras un cambio o un restablecimiento hecho en otra pestaña):
     * cancela el guardado propio pendiente para no reescribir datos viejos y no escribe nada.
     */
    adopt(): LoadResult {
      clearTimer();
      pending = null;
      return this.load();
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

export interface StorageEventLike {
  key: string | null;
  newValue: string | null;
}
export interface StorageTarget {
  addEventListener(type: 'storage', handler: (e: StorageEventLike) => void): void;
  removeEventListener(type: 'storage', handler: (e: StorageEventLike) => void): void;
}

/**
 * Avisa cuando OTRA pestaña del mismo navegador cambia, borra (restablecer) o vacía el estado guardado de la demo
 * (el evento `storage` solo se dispara en las demás pestañas). `removed` es true si la clave se borró.
 */
export function attachStorageSync(target: StorageTarget, onChange: (info: { removed: boolean }) => void): () => void {
  const handler = (e: StorageEventLike) => {
    if (e.key === null || e.key === STORAGE_KEY) onChange({ removed: e.newValue === null });
  };
  target.addEventListener('storage', handler);
  return () => target.removeEventListener('storage', handler);
}
