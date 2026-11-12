import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig, requireModel } from '../../server/src/config.ts';

// Clave inventada, armada en tiempo de ejecución (el archivo no contiene ninguna cadena con forma de clave).
const KEY = 'sk-' + 'proj-' + 'Qq7_'.repeat(12);

describe('loadConfig', () => {
  it('no trae ningún modelo por defecto (principio IX)', () => {
    const c = loadConfig({});
    expect(c.models).toEqual({ diagnosis: null, strategy: null, critic: null });
    expect(c.keyConfigured).toBe(false);
  });

  it('usa los valores por defecto documentados', () => {
    const c = loadConfig({});
    expect(c.limits.maxIterations).toBe(10);
    expect(c.limits.maxInputChars).toBe(120000);
    expect(c.limits.maxXlsxRows).toBe(2000);
    expect(c.limits.maxFileBytes).toBe(26_214_400);
    expect(c.port).toBe(8787);
    expect(c.provider).toBe('openai');
    expect(c.allowedOrigins).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173']);
  });

  it('lee las variables y trata los valores vacíos como ausentes', () => {
    const c = loadConfig({
      OPENAI_API_KEY: KEY,
      OPENAI_MODEL_DIAGNOSTICO: 'modelo-d',
      OPENAI_MODEL_ESTRATEGIA: '',
      MAX_ITERATIONS: '4',
      PORT: '9000',
      ALLOWED_ORIGINS: 'http://localhost:3000, http://127.0.0.1:3000',
      OPENAI_REASONING_DIAGNOSTICO: 'low',
    });
    expect(c.keyConfigured).toBe(true);
    expect(c.models.diagnosis).toBe('modelo-d');
    expect(c.models.strategy).toBeNull();
    expect(c.limits.maxIterations).toBe(4);
    expect(c.port).toBe(9000);
    expect(c.allowedOrigins).toEqual(['http://localhost:3000', 'http://127.0.0.1:3000']);
    expect(c.reasoning.diagnosis).toBe('low');
    expect(c.reasoning.strategy).toBeNull();
  });

  it('la clave nunca aparece en lo que se serializa ni se enumera', () => {
    const c = loadConfig({ OPENAI_API_KEY: KEY });
    expect(JSON.stringify(c)).not.toContain(KEY);
    expect(JSON.stringify(Object.entries(c))).not.toContain(KEY);
    expect(String(c.getApiKey())).toBe(KEY); // solo por el acceso explícito del cliente del proveedor
  });

  it('solo acepta MODEL_PROVIDER openai o fake', () => {
    expect(loadConfig({ MODEL_PROVIDER: 'fake' }).provider).toBe('fake');
    expect(() => loadConfig({ MODEL_PROVIDER: 'otro' })).toThrow(ConfigError);
  });

  it('rechaza números inválidos y niveles de razonamiento desconocidos', () => {
    expect(() => loadConfig({ MAX_ITERATIONS: 'abc' })).toThrow(ConfigError);
    expect(() => loadConfig({ MAX_ITERATIONS: '0' })).toThrow(ConfigError);
    expect(() => loadConfig({ PORT: '99999' })).toThrow(ConfigError);
    expect(() => loadConfig({ OPENAI_REASONING_DIAGNOSTICO: 'enorme' })).toThrow(ConfigError);
  });

  it('el mensaje de error no incluye la clave', () => {
    try {
      loadConfig({ OPENAI_API_KEY: KEY, MAX_ITERATIONS: 'abc' });
    } catch (e) {
      expect(String((e as Error).message)).not.toContain(KEY);
    }
  });
});

describe('requireModel', () => {
  it('sin modelo configurado lanza no_model_configured y nombra la variable que falta', () => {
    const c = loadConfig({});
    for (const [stage, variable] of [
      ['diagnosis', 'OPENAI_MODEL_DIAGNOSTICO'],
      ['strategy', 'OPENAI_MODEL_ESTRATEGIA'],
      ['critic', 'OPENAI_MODEL_CRITICO'],
    ] as const) {
      try {
        requireModel(c, stage);
        throw new Error('debía lanzar');
      } catch (e) {
        expect(e).toBeInstanceOf(ConfigError);
        expect((e as ConfigError).category).toBe('no_model_configured');
        expect((e as ConfigError).message).toContain(variable);
      }
    }
  });

  it('con modelo configurado lo devuelve', () => {
    const c = loadConfig({ OPENAI_MODEL_DIAGNOSTICO: 'modelo-d' });
    expect(requireModel(c, 'diagnosis')).toBe('modelo-d');
  });
});
