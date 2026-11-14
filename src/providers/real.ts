// Proveedor «IA real»: habla con el servicio local por `/api/…`. El navegador decide por `error.category`, no por el HTTP.
import type { MissingInfo, RealFinding, RealState, TraceStepSummary, TraceSummary } from '../state/types';
import type { DiagnosisResponse, ErrorCategory, Result, ServerFileResult, ServiceError, ServiceTraceStep } from './types';

const MAX_ARG = 200;

/** Recorta cadenas largas de los argumentos (AG-025: la traza guardada no arrastra fragmentos enormes). */
export function clip(v: unknown): unknown {
  if (typeof v === 'string') return v.length > MAX_ARG ? `${v.slice(0, MAX_ARG)}…` : v;
  if (Array.isArray(v)) return v.map(clip);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clip(x)]));
  return v;
}

function summarizeStep(s: ServiceTraceStep): TraceStepSummary {
  switch (s.type) {
    case 'tool':
      return { type: 'tool', name: s.name, args: clip(s.args), resultSummary: String(s.resultSummary).slice(0, MAX_ARG), ok: s.ok };
    case 'verification':
      return { type: 'verification', findingTempId: s.findingTempId.slice(0, MAX_ARG), ok: s.ok, ...(s.reason ? { reason: s.reason.slice(0, 400) } : {}), ...(s.resolution ? { resolution: s.resolution } : {}) };
    case 'tool_error':
      return { type: 'tool_error', name: s.name, error: s.error.slice(0, 400) };
    case 'warning':
      return { type: 'warning', code: s.code, message: s.message.slice(0, 400) };
    case 'model_error':
      return { type: 'model_error', category: s.category, message: s.message.slice(0, 400) };
  }
}

/** Resumen de la traza para guardar (data-model «Traza»). Sin texto completo de archivos. */
export function summarizeTrace(r: DiagnosisResponse, startedAt: string, finishedAt: string): TraceSummary {
  const steps = r.trace.map(summarizeStep);
  const toolCounts: Record<string, number> = {};
  for (const s of steps) if (s.type === 'tool' || s.type === 'tool_error') toolCounts[s.name] = (toolCounts[s.name] ?? 0) + 1;
  return {
    stage: 'diagnosis',
    model: r.run.model,
    reasoning: r.run.reasoning,
    iterations: r.run.iterations,
    tokens: r.run.tokens,
    partial: r.run.partial,
    errors: steps.flatMap((s) => (s.type === 'model_error' ? [{ category: s.category, message: s.message }] : s.type === 'tool_error' ? [{ category: 'tool_error', message: s.error }] : [])),
    startedAt,
    finishedAt,
    toolCounts,
    verificationFailures: steps.filter((s) => s.type === 'verification' && !s.ok).length,
    steps,
  };
}

/**
 * Convierte la respuesta del servicio en el estado «real» del proyecto. `verified` de un hallazgo exige al menos una cita
 * verificada y ninguna presentada como verificada sin serlo (AG-016, AG-017): la regla se aplica aquí otra vez, sin confiar solo en el servicio.
 */
export function toRealState(r: DiagnosisResponse, startedAt: string, finishedAt: string): RealState {
  const findings: RealFinding[] = r.findings.map((f) => {
    const verified = f.verified && f.citations.some((c) => c.verified);
    return {
      id: f.id,
      dimension: f.dimension,
      title: f.title,
      text: f.text,
      verified,
      ...(!verified ? { unverifiedReason: f.unverifiedReason ?? 'Ninguna cita pudo verificarse.' } : {}),
      // Solo el fragmento citado: nunca el texto completo del archivo.
      citations: f.citations.map((c) => ({ file: c.file, location: c.location, quote: c.quote, verified: c.verified })),
      origin: 'agent' as const,
    };
  });
  const missingInfo: MissingInfo[] = r.missingInfo.map((m) => ({ dimension: m.dimension, description: m.description.slice(0, 400) }));
  return { findings, missingInfo, objections: [], diagnosisRun: summarizeTrace(r, startedAt, finishedAt) };
}

const KNOWN: readonly ErrorCategory[] = [
  'spend_limit', 'balance', 'rate_limit', 'auth', 'usage_limit', 'invalid_request', 'model_unavailable', 'access_denied',
  'provider_unavailable', 'no_model_configured', 'input_too_large', 'bad_request', 'extraction_failed', 'internal',
];

async function readError(r: Response): Promise<ServiceError> {
  try {
    const b = (await r.json()) as { error?: Partial<ServiceError> & { category?: string } };
    const e = b.error;
    if (e && typeof e.message === 'string') {
      const category = (KNOWN as readonly string[]).includes(e.category ?? '') ? (e.category as ErrorCategory) : 'internal';
      return {
        category,
        message: e.message,
        retryable: e.retryable === true,
        ...(typeof e.retryAfterSeconds === 'number' ? { retryAfterSeconds: e.retryAfterSeconds } : {}),
        ...(typeof e.providerStatus === 'number' ? { providerStatus: e.providerStatus } : {}),
        ...(typeof e.providerCode === 'string' ? { providerCode: e.providerCode } : {}),
        ...(Array.isArray(e.trace) ? { trace: e.trace } : {}),
      };
    }
  } catch {
    /* cuerpo que no es JSON */
  }
  return { category: 'internal', message: 'El servicio local respondió algo inesperado.', retryable: false };
}

const UNREACHABLE: ServiceError = { category: 'unreachable', message: 'No se pudo contactar el servicio local. Comprueba que siga en ejecución.', retryable: true };

export function createRealProvider(fetchFn: typeof fetch = fetch) {
  async function call<T>(url: string, init: RequestInit | undefined, parse: (b: unknown) => T): Promise<Result<T>> {
    let r: Response;
    try {
      r = await fetchFn(url, init);
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') throw e;
      return { ok: false, error: UNREACHABLE };
    }
    if (!r.ok) return { ok: false, error: await readError(r) };
    try {
      return { ok: true, value: parse(await r.json()) };
    } catch {
      return { ok: false, error: { category: 'internal', message: 'El servicio local respondió algo inesperado.', retryable: false } };
    }
  }
  const enc = encodeURIComponent;
  return {
    /** Sube los archivos (solo a 127.0.0.1 vía el proxy local); el servicio extrae el texto en memoria. */
    uploadFiles(projectId: string, files: File[]): Promise<Result<ServerFileResult[]>> {
      const form = new FormData();
      for (const f of files) form.append('files', f, f.name);
      return call(`/api/evidence?projectId=${enc(projectId)}`, { method: 'POST', body: form }, (b) => (b as { files: ServerFileResult[] }).files);
    },
    listFiles(projectId: string): Promise<Result<ServerFileResult[]>> {
      return call(`/api/evidence/${enc(projectId)}`, undefined, (b) => (b as { files: ServerFileResult[] }).files);
    },
    removeFile(projectId: string, fileId: string): Promise<Result<true>> {
      return call(`/api/evidence/${enc(projectId)}/${enc(fileId)}`, { method: 'DELETE' }, () => true as const);
    },
    runDiagnosis(projectId: string, empresa: string, signal?: AbortSignal): Promise<Result<DiagnosisResponse>> {
      return call(
        '/api/diagnosis/run',
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ projectId, empresa }), signal },
        (b) => b as DiagnosisResponse,
      );
    },
  };
}

export type RealProvider = ReturnType<typeof createRealProvider>;
