import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachFlush, createPersistence, STORAGE_KEY, type StorageLike } from '../../src/state/persistence';
import { SCHEMA_VERSION, type PersistedState } from '../../src/state/types';

const catalogs = { projectIds: ['P-A', 'P-B'], findingIds: ['H1', 'H2'], criterionIds: ['c1'] };

function initial(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    session: { role: null },
    projects: {
      'P-A': { answers: {}, localFiles: [], diagnosis: { status: 'none', decisions: {} }, strategy: { status: 'none' } },
      'P-B': { answers: {}, localFiles: [], diagnosis: { status: 'none', decisions: {} }, strategy: { status: 'none' } },
    },
    gradings: {},
    surveys: {},
    activity: [],
  };
}

function memoryStorage(seed?: string) {
  const data = new Map<string, string>();
  if (seed !== undefined) data.set(STORAGE_KEY, seed);
  const s = {
    data,
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
  };
  return s;
}

function make(storage: StorageLike) {
  const onMemoryMode = vi.fn();
  const p = createPersistence({ storage, initialState: initial, catalogs, onMemoryMode });
  return { p, onMemoryMode };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('carga', () => {
  it('nada guardado → estado inicial sin aviso', () => {
    const { p } = make(memoryStorage());
    const r = p.load();
    expect(r.state).toEqual(initial());
    expect(r.notice).toBeNull();
  });
  it('guardar y volver a cargar es idéntico y el archivo solo trae nombre, tipo y tamaño', () => {
    const s = memoryStorage();
    const a = make(s).p;
    const st = initial();
    st.session.role = 'consultor';
    st.projects['P-A'].diagnosis = { status: 'generated', decisions: { H1: { state: 'edited', text: 'x' } } };
    st.projects['P-A'].localFiles = [
      { id: 'f1', name: 'a.pdf', type: 'application/pdf', size: 10, addedAt: '2026-11-01T10:00:00Z', content: 'SECRETO' } as never,
    ];
    a.save(st);
    a.flush();
    expect(s.data.get(STORAGE_KEY)).not.toContain('SECRETO');
    const loaded = make(s).p.load();
    expect(loaded.notice).toBeNull();
    expect(loaded.state.session.role).toBe('consultor');
    expect(loaded.state.projects['P-A'].diagnosis.decisions.H1).toEqual({ state: 'edited', text: 'x' });
    expect(loaded.state.projects['P-A'].localFiles).toEqual([
      { id: 'f1', name: 'a.pdf', type: 'application/pdf', size: 10, addedAt: '2026-11-01T10:00:00Z' },
    ]);
  });
  it('schemaVersion distinta → estado inicial + aviso de versión', () => {
    const bad = { ...initial(), schemaVersion: 99 };
    const r = make(memoryStorage(JSON.stringify(bad))).p.load();
    expect(r.state).toEqual(initial());
    expect(r.notice).toBe('version');
  });
  it('JSON inválido → estado inicial + aviso de datos dañados', () => {
    const r = make(memoryStorage('{no es json')).p.load();
    expect(r.state).toEqual(initial());
    expect(r.notice).toBe('corrupt');
  });
  it('forma inválida (decisión sobre hallazgo inexistente) → dañado', () => {
    const st = initial();
    st.projects['P-A'].diagnosis.decisions = { H999: { state: 'accepted' } };
    const r = make(memoryStorage(JSON.stringify(st))).p.load();
    expect(r.notice).toBe('corrupt');
    expect(r.state).toEqual(initial());
  });
  it('forma inválida (tipo incorrecto) → dañado', () => {
    const r = make(memoryStorage(JSON.stringify({ schemaVersion: SCHEMA_VERSION, session: 5 }))).p.load();
    expect(r.notice).toBe('corrupt');
  });
  it('getItem lanza → modo memoria + aviso permanente', () => {
    const s = memoryStorage();
    s.getItem.mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const { p, onMemoryMode } = make(s);
    const r = p.load();
    expect(r.notice).toBe('memory');
    expect(r.state).toEqual(initial());
    expect(p.isMemoryMode()).toBe(true);
    expect(onMemoryMode).toHaveBeenCalled();
  });
});

describe('guardado', () => {
  it('setItem lanza → modo memoria; la aplicación sigue', () => {
    const s = memoryStorage();
    s.setItem.mockImplementation(() => {
      throw new Error('cuota');
    });
    const { p, onMemoryMode } = make(s);
    p.load();
    p.save(initial());
    vi.advanceTimersByTime(200);
    expect(p.isMemoryMode()).toBe(true);
    expect(onMemoryMode).toHaveBeenCalledTimes(1);
    expect(() => p.save(initial())).not.toThrow();
  });
  it('restablecer llama a removeItem y devuelve el estado inicial', () => {
    const s = memoryStorage(JSON.stringify(initial()));
    const { p } = make(s);
    expect(p.reset()).toEqual(initial());
    expect(s.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
  it('ráfagas dentro de 200 ms se agrupan en una escritura', () => {
    const s = memoryStorage();
    const { p } = make(s);
    p.save(initial());
    vi.advanceTimersByTime(100);
    p.save(initial());
    vi.advanceTimersByTime(100);
    expect(s.setItem).not.toHaveBeenCalled(); // el segundo save reinició el plazo
    vi.advanceTimersByTime(100);
    expect(s.setItem).toHaveBeenCalledTimes(1);
  });
});

describe('flush', () => {
  it('cambio + flush antes de 200 ms escribe una sola vez y cancela el temporizador', () => {
    const s = memoryStorage();
    const { p } = make(s);
    p.save(initial());
    p.flush();
    expect(s.setItem).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(s.setItem).toHaveBeenCalledTimes(1);
  });
  it('flush sin cambios no escribe', () => {
    const s = memoryStorage();
    const { p } = make(s);
    p.flush();
    expect(s.setItem).not.toHaveBeenCalled();
    p.save(initial());
    p.flush();
    p.flush();
    expect(s.setItem).toHaveBeenCalledTimes(1);
  });
  it('flush con setItem que lanza → modo memoria', () => {
    const s = memoryStorage();
    s.setItem.mockImplementation(() => {
      throw new Error('x');
    });
    const { p } = make(s);
    p.save(initial());
    p.flush();
    expect(p.isMemoryMode()).toBe(true);
  });
  it('en modo memoria flush no hace nada', () => {
    const s = memoryStorage();
    s.getItem.mockImplementation(() => {
      throw new Error('x');
    });
    const { p } = make(s);
    p.load();
    p.save(initial());
    p.flush();
    expect(s.setItem).not.toHaveBeenCalled();
  });
});

describe('attachFlush', () => {
  function fakeTarget() {
    const handlers: Record<string, () => void> = {};
    return {
      handlers,
      addEventListener: vi.fn((t: string, h: () => void) => void (handlers[t] = h)),
      removeEventListener: vi.fn((t: string) => void delete handlers[t]),
    };
  }
  it('pagehide llama a flush', () => {
    const t = fakeTarget();
    const flush = vi.fn();
    attachFlush(t, flush, () => 'visible');
    t.handlers.pagehide();
    expect(flush).toHaveBeenCalledTimes(1);
  });
  it('visibilitychange solo llama a flush si la página queda oculta', () => {
    const t = fakeTarget();
    const flush = vi.fn();
    let vis: 'hidden' | 'visible' = 'visible';
    attachFlush(t, flush, () => vis);
    t.handlers.visibilitychange();
    expect(flush).not.toHaveBeenCalled();
    vis = 'hidden';
    t.handlers.visibilitychange();
    expect(flush).toHaveBeenCalledTimes(1);
  });
  it('la función devuelta quita ambos oyentes', () => {
    const t = fakeTarget();
    const off = attachFlush(t, vi.fn(), () => 'visible');
    off();
    expect(t.removeEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function));
    expect(t.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
