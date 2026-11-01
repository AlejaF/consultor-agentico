import type { Role } from '../app/router';

export const SCHEMA_VERSION = 2;

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

export interface ProjectState {
  answers: Record<string, string>;
  localFiles: LocalFileMeta[];
  diagnosis: DiagnosisState;
  strategy: StrategyState;
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
