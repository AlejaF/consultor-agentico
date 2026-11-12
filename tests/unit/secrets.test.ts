import { describe, expect, it } from 'vitest';
import { forbiddenTracked, isScannable, scanFiles, scanText } from '../../scripts/lib/secrets.mjs';

// Las claves de prueba se arman en tiempo de ejecución y son inventadas: así este archivo no contiene
// ninguna cadena con forma de clave y el propio escáner no lo marca (principio IX).
const body = (n: number) => 'Ab1_'.repeat(Math.ceil(n / 4)).slice(0, n);
const fake = {
  proj: 'sk-' + 'proj-' + body(40),
  svcacct: 'sk-' + 'svcacct-' + body(40),
  admin: 'sk-' + 'admin-' + body(40),
  marker: 'sk-' + 'A'.repeat(20) + 'T3BlbkFJ' + 'B'.repeat(20),
  generic: 'sk-' + 'Zz9'.repeat(14),
};

describe('scanText', () => {
  it('detecta el formato actual de las claves (proj, svcacct, admin)', () => {
    for (const k of [fake.proj, fake.svcacct, fake.admin]) {
      const r = scanText('a.ts', `const k = "${k}";`);
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].path).toBe('a.ts');
      expect(r[0].line).toBe(1);
    }
  });

  it('detecta el formato con la marca interna y el genérico', () => {
    expect(scanText('a.ts', fake.marker).length).toBeGreaterThan(0);
    expect(scanText('a.ts', `x ${fake.generic} y`).length).toBeGreaterThan(0);
  });

  it('detecta una asignación de OPENAI_API_KEY con valor y una clave literal entre comillas', () => {
    expect(scanText('.env', 'OPENAI_API_KEY=' + body(30)).length).toBeGreaterThan(0);
    expect(scanText('a.ts', 'const apiKey = "' + body(30) + '";').length).toBeGreaterThan(0);
  });

  it('NO marca un .env.example sin valores ni nombres de variable sueltos', () => {
    const example = '# clave del proveedor\nOPENAI_API_KEY=\nOPENAI_MODEL_DIAGNOSTICO=\nPORT=\n';
    expect(scanText('server/.env.example', example)).toEqual([]);
    expect(scanText('README.md', 'Pon la clave en OPENAI_API_KEY (no la subas).')).toEqual([]);
  });

  it('NO marca palabras comunes que terminan en «sk»', () => {
    expect(scanText('a.md', 'risk-assessment-for-the-whole-organisation-process-flow')).toEqual([]);
  });

  it('respeta la marca de excepción en la misma línea', () => {
    expect(scanText('a.ts', `const k = "${fake.proj}"; // secrets:allow`)).toEqual([]);
  });

  it('nunca devuelve la clave completa en el resultado', () => {
    const r = scanText('a.ts', `k=${fake.proj}`);
    const dump = JSON.stringify(r);
    expect(dump).not.toContain(fake.proj);
    expect(dump).not.toContain(body(40));
  });

  it('informa la línea correcta', () => {
    const r = scanText('a.ts', `uno\ndos\n${fake.proj}\n`);
    expect(r[0].line).toBe(3);
  });
});

describe('scanFiles', () => {
  it('revisa varios archivos (por ejemplo, un dist simulado)', () => {
    const r = scanFiles([
      { path: 'dist/assets/index.js', text: `var a="${fake.proj}"` },
      { path: 'dist/index.html', text: '<html></html>' },
    ]);
    expect(r.map((x: { path: string }) => x.path)).toEqual(['dist/assets/index.js']);
  });
});

describe('forbiddenTracked', () => {
  it('marca .env y server/.env versionados, pero no los ejemplos', () => {
    expect(forbiddenTracked(['server/.env', 'src/a.ts'])).toEqual(['server/.env']);
    expect(forbiddenTracked(['.env', '.env.local'])).toEqual(['.env', '.env.local']);
    expect(forbiddenTracked(['server/.env.example', '.env.example'])).toEqual([]);
  });
});

describe('isScannable', () => {
  it('revisa texto y omite binarios, dependencias y bloqueos', () => {
    expect(isScannable('src/a.ts')).toBe(true);
    expect(isScannable('dist/assets/x.js')).toBe(true);
    expect(isScannable('public/a.png')).toBe(false);
    expect(isScannable('node_modules/x/index.js')).toBe(false);
    expect(isScannable('package-lock.json')).toBe(false);
  });
});
