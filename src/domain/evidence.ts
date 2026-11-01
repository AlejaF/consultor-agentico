import { EVIDENCE_SLOTS, resolveName } from '../data/evidence';
import type { Project } from '../data/projects';
import type { LocalFileMeta } from '../state/types';
import { kindOfFile, type EvidenceKind } from './progress';

export interface EvidenceItem {
  id: string;
  origin: 'ejemplo' | 'propio';
  kind: EvidenceKind;
  name: string;
  detail: string;
  processing: boolean;
  file?: LocalFileMeta;
}

/** Evidencia visible de un proyecto: la de ejemplo de sus ranuras y los archivos propios. */
export function buildEvidenceItems(project: Project, companyName: string, localFiles: readonly LocalFileMeta[]): EvidenceItem[] {
  const sample: EvidenceItem[] = EVIDENCE_SLOTS.filter((s) => project.sampleSlots.includes(s.slot)).map((s) => ({
    id: `slot-${s.slot}`,
    origin: 'ejemplo',
    kind: s.kind,
    name: resolveName(s.name, companyName),
    detail: s.detail,
    processing: project.pendingSlots.includes(s.slot),
  }));
  const own: EvidenceItem[] = localFiles.map((f) => ({
    id: f.id,
    origin: 'propio',
    kind: kindOfFile(f.name),
    name: f.name,
    detail: f.type,
    processing: false,
    file: f,
  }));
  return [...sample, ...own];
}
