import type { Role } from '../app/router';

export const SCHEMA_VERSION = 3;

export interface LocalFileMeta {
  id: string;
  name: string;
  type: string;
  size: number;
  addedAt: string;
}

export type Decision =
  | { state: 'pending' }
  | { state: 'accepted' }
  | { state: 'edited'; text: string }
  | { state: 'rejected' };

export interface DiagnosisState {
  status: 'none' | 'generated' | 'issued';
  generatedAt?: string;
  issuedAt?: string;
  decisions: Record<string, Decision>;
}

export interface StrategyState {
  status: 'none' | 'generated' | 'sent';
  generatedAt?: string;
  sentAt?: string;
}

/** Modo del proyecto (AG-001, AG-029): se fija al generar el diagnóstico. */
export type Mode = 'simulated' | 'real';

/** Archivo subido al servicio local: solo metadatos (AG-025); el texto vive en la memoria del servicio. */
export interface ServerFileMeta {
  id: string;
  name: string;
  type: string;
  size: number;
}

/** Ubicación de una cita real, tal como la manda el servicio (contracts/api.md). */
export type RealLocation =
  | { kind: 'page'; page: number }
  | { kind: 'paragraph'; n: number }
  | { kind: 'sheet'; sheet: string; row: number }
  | { kind: 'line'; n: number }
  | { kind: 'time'; start: string };

/** Cita real: se guarda el fragmento citado, nunca el texto completo del archivo (AG-025). */
export interface RealCitation {
  file: string;
  location: RealLocation;
  quote: string;
  verified: boolean;
}

/** Hallazgo real: compatible con `Finding` de la 001 (data-model.md). */
export interface RealFinding {
  id: string;
  dimension: 'estrategia' | 'infraestructura' | 'datos' | 'gobernanza' | 'talento' | 'cultura';
  title: string;
  text: string;
  verified: boolean;
  unverifiedReason?: string;
  citations: RealCitation[];
  origin: 'agent';
}

/** Información faltante por pilar (AG-021): texto de salida, sin flujos. */
export interface MissingInfo {
  dimension: RealFinding['dimension'];
  description: string;
}

/** Paso de la traza guardado de forma resumida (argumentos recortados a 200 caracteres). */
export type TraceStepSummary =
  | { type: 'tool'; name: string; args: unknown; resultSummary: string; ok: boolean }
  | { type: 'verification'; findingTempId: string; ok: boolean; reason?: string; resolution?: 'corregida' | 'descartada' | 'no_verificado' }
  | { type: 'tool_error'; name: string; error: string }
  | { type: 'warning'; code: string; message: string }
  | { type: 'model_error'; category: string; message: string };

/** Traza resumida de una corrida (AG-009, AG-025). */
export interface TraceSummary {
  stage: 'diagnosis' | 'strategy' | 'critic';
  model: string;
  reasoning?: string | null;
  iterations: number;
  tokens: { input: number; output: number; total: number };
  partial: boolean;
  errors: { category: string; message: string }[];
  startedAt: string;
  finishedAt: string;
  toolCounts: Record<string, number>;
  verificationFailures: number;
  steps: TraceStepSummary[];
}

export interface RealState {
  findings: RealFinding[];
  missingInfo: MissingInfo[];
  objections: unknown[];
  diagnosisRun?: TraceSummary;
}

/** `mode` y `serverFiles` son opcionales a propósito: ausentes equivalen a «simulated» y [] (contracts/persisted-state-v3.md). */
export interface ProjectState {
  answers: Record<string, string>;
  localFiles: LocalFileMeta[];
  diagnosis: DiagnosisState;
  strategy: StrategyState;
  mode?: Mode;
  serverFiles?: ServerFileMeta[];
  real?: RealState;
}

export interface Grading {
  levels: Record<string, 1 | 2 | 3 | 4 | 5>;
  comment: string;
  average: number;
  gradedAt: string;
}

export interface SurveyResponse {
  answers: Record<string, number | string>;
  submittedAt?: string;
}

export interface ActivityItem {
  at: string;
  text: string;
  projectId?: string;
}

export interface PersistedState {
  schemaVersion: typeof SCHEMA_VERSION;
  session: { role: Role | null };
  projects: Record<string, ProjectState>;
  gradings: Record<string, Grading>;
  surveys: Record<string, SurveyResponse>;
  activity: ActivityItem[];
}

/** Catálogos inyectados para validar la forma de lo guardado. */
export interface Catalogs {
  projectIds: readonly string[];
  findingIds: readonly string[];
  criterionIds: readonly string[];
}
