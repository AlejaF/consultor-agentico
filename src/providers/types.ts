// Contrato del servicio local (specs/002-agente-real/contracts/api.md) como tipos del navegador.
import type { RealLocation } from '../state/types';

export type ErrorCategory =
  | 'spend_limit'
  | 'balance'
  | 'rate_limit'
  | 'auth'
  | 'usage_limit'
  | 'invalid_request'
  | 'model_unavailable'
  | 'access_denied'
  | 'provider_unavailable'
  | 'no_model_configured'
  | 'input_too_large'
  | 'bad_request'
  | 'extraction_failed'
  | 'internal'
  | 'unreachable';

export interface ServiceHealth {
  ok: boolean;
  version: string;
  keyConfigured: boolean;
  models: { diagnosis: string | null; strategy: string | null; critic: string | null };
  fake: boolean;
}

export type Availability = { state: 'checking' } | { state: 'unavailable' } | { state: 'available'; health: ServiceHealth };

export interface ServerFileResult {
  id: string;
  name: string;
  type?: string;
  size?: number;
  status: 'extracted' | 'failed';
  reason?: string;
  message?: string;
  chars?: number;
  chunkCount?: number;
  warning?: string;
}

export type ServiceTraceStep =
  | { type: 'tool'; name: string; args: unknown; resultSummary: string; ok: boolean }
  | { type: 'verification'; findingTempId: string; ok: boolean; reason?: string; resolution?: 'corregida' | 'descartada' | 'no_verificado' }
  | { type: 'tool_error'; name: string; error: string }
  | { type: 'warning'; code: string; message: string }
  | { type: 'model_error'; category: string; message: string };

export interface ServiceFinding {
  id: string;
  dimension: 'estrategia' | 'infraestructura' | 'datos' | 'gobernanza' | 'talento' | 'cultura';
  title: string;
  text: string;
  verified: boolean;
  unverifiedReason?: string;
  citations: { file: string; location: RealLocation; quote: string; verified: boolean }[];
}

export interface DiagnosisResponse {
  run: { stage: 'diagnosis'; model: string; reasoning: string | null; iterations: number; partial: boolean; tokens: { input: number; output: number; total: number } };
  findings: ServiceFinding[];
  missingInfo: { dimension: ServiceFinding['dimension']; description: string }[];
  trace: ServiceTraceStep[];
  warnings: { code: string; message: string }[];
}

/** Error del servicio ya normalizado: el navegador decide por `category`, nunca por el código HTTP. */
export interface ServiceError {
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  retryAfterSeconds?: number;
  providerStatus?: number;
  providerCode?: string;
  trace?: ServiceTraceStep[];
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: ServiceError };
