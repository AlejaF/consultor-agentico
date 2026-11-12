// Detección de claves y secretos (principio IX, SC-A2). Funciones puras y probadas.
// Nunca devuelve el secreto completo: solo la regla, la ruta, la línea y un prefijo corto.
// Los formatos de clave de OpenAI salen de fuentes de terceros (NO VERIFICADO en la documentación oficial):
// esto es una red de seguridad, no la única defensa (la clave solo vive en server/.env, ignorado por git).

export const ALLOW_MARK = 'secrets:allow';

export const RULES = [
  { id: 'openai-proj', re: /sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}/ },
  { id: 'openai-marker', re: /sk-[A-Za-z0-9]{20,}T3BlbkFJ[A-Za-z0-9]{20,}/ },
  { id: 'sk-generica', re: /\bsk-[A-Za-z0-9_-]{32,}/ },
  { id: 'openai-env', re: /OPENAI_API_KEY\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/ },
  { id: 'asignacion-secreta', re: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"][^'"\s]{16,}['"]/i },
];

const SKIP_PATH = /(^|\/)(node_modules|\.git)\//;
const SKIP_NAME = /(^|\/)package-lock\.json$/;
const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot|pdf|zip|gz|docx|xlsx|mp3|mp4|webm|wav)$/i;

/** ¿Vale la pena revisar el contenido de este archivo? */
export function isScannable(path) {
  const p = path.replaceAll('\\', '/');
  return !SKIP_PATH.test(p) && !SKIP_NAME.test(p) && !BINARY_EXT.test(p);
}

/** Revisa un texto y devuelve hallazgos `{ path, line, rule, preview }` sin el secreto completo. */
export function scanText(path, text) {
  const found = [];
  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes(ALLOW_MARK)) return;
    for (const rule of RULES) {
      const m = rule.re.exec(line);
      if (m) {
        found.push({ path, line: i + 1, rule: rule.id, preview: `${m[0].slice(0, 6)}…` });
        break; // una regla por línea basta para avisar
      }
    }
  });
  return found;
}

/** Revisa varios archivos `{ path, text }`. */
export function scanFiles(files) {
  return files.filter((f) => isScannable(f.path)).flatMap((f) => scanText(f.path, f.text));
}

/** Archivos de entorno que NO deben estar versionados (los `.env.example` sí pueden). */
export function forbiddenTracked(paths) {
  return paths.filter((p) => {
    const base = p.replaceAll('\\', '/').split('/').pop() ?? '';
    return base.startsWith('.env') && base !== '.env.example';
  });
}
