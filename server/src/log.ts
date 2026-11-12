// Registro mínimo (principios I y IX): solo método, ruta sin cadena de consulta, estado, duración, tokens y
// categoría de error. NUNCA cuerpos de solicitud, contenido de documentos ni claves.

export interface RequestLog {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  tokens?: number;
  errorCategory?: string;
}

export interface Logger {
  request(fields: RequestLog): void;
  info(message: string): void;
}

export function createLogger(write: (line: string) => void = (l) => console.log(l)): Logger {
  return {
    request(f) {
      // Lista blanca explícita: cualquier otro campo que llegue se descarta.
      const safe: RequestLog = { method: f.method, path: f.path.split('?')[0], status: f.status, durationMs: Math.round(f.durationMs) };
      if (f.tokens !== undefined) safe.tokens = f.tokens;
      if (f.errorCategory !== undefined) safe.errorCategory = f.errorCategory;
      write(JSON.stringify({ at: new Date().toISOString(), ...safe }));
    },
    info(message) {
      write(JSON.stringify({ at: new Date().toISOString(), info: message }));
    },
  };
}
