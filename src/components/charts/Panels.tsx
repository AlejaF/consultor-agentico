// Paneles de gráfico por pantalla (AG-035, lote H3): unen una función pura de `domain/charts` con un componente de presentación.
import { DIAGNOSIS } from '../../data/diagnosis';
import type { Dimension } from '../../data/diagnosis';
import { evidenceCoverage, maturityByProject, provenanceMatrix, reviewSegments, riskLevelSegments, stageSegments, traceSummary, type Provenance } from '../../domain/charts';
import { countOf, formatDecimal } from '../../domain/format';
import { projectMaturity } from '../../domain/maturity';
import { projectProgress } from '../../domain/progress';
import { reviewStats } from '../../domain/visual';
import { canSeeTrace } from '../../domain/visibility';
import { buildEvidenceItems } from '../../domain/evidence';
import { allProjects, companyFor } from '../../domain/lookup';
import { useAppState } from '../../state/context';
import { useAvailability } from '../../providers/useAvailability';
import type { Decision, PersistedState, TraceSummary } from '../../state/types';
import type { DerivedStrategy } from '../../domain/strategy';
import { ChartFrame, DotMatrix, Heatmap, Meter, RankedBars, SegmentedBar } from './index';

type F = { id: string; title?: string; dimension: Dimension; verified: boolean; realCitations?: readonly { file: string }[] };

/** P1 · «¿Qué documentos sostienen cada pilar?» Solo diagnóstico real (las citas del simulado no son archivos del usuario). */
export function CoveragePanel({ findings, decisions }: { findings: readonly F[]; decisions: Record<string, Decision> }) {
  const data = evidenceCoverage(findings, decisions);
  const none = data.docs.length === 0;
  return (
    <ChartFrame
      testId="chart-coverage"
      headingId="cobertura-titulo"
      title="Cobertura de evidencia: ¿qué documentos sostienen cada pilar?"
      summary={none ? 'Sin documentos citados todavía.' : `${countOf(data.total, 'hallazgo vigente', 'hallazgos vigentes')} (aceptados o editados y verificados) en ${countOf(data.docs.length, 'documento', 'documentos')}. Una celda vacía significa «sin evidencia».`}
      table={{
        caption: 'Hallazgos vigentes por pilar y documento',
        head: ['Pilar', ...data.docs, 'Total'],
        rows: [...data.rows.map((r) => [r.label, ...r.cells.map((n) => (n === 0 ? 'sin evidencia' : n)), r.total === 0 ? 'sin evidencia' : r.total]), ['Total', ...data.colTotals.map((n) => (n === 0 ? 'sin evidencia' : n)), data.total]],
      }}
    >
      {none ? null : <Heatmap data={data} />}
    </ChartFrame>
  );
}

const REVIEW_TONES = { accepted: 'ok', edited: 'acc', rejected: 'low', pending: 'mute' };

/** P1 · «¿Cómo va la revisión?» Barra segmentada con leyenda; NO VERIFICADO se cuenta aparte. */
export function ReviewStatePanel({ findings, decisions }: { findings: readonly { id: string; verified: boolean }[]; decisions: Record<string, Decision> }) {
  const s = reviewSegments(reviewStats(findings, decisions));
  return (
    <ChartFrame
      testId="chart-review-state"
      title="Estado de la revisión: ¿cuántos hallazgos faltan por decidir?"
      summary={`${s.total} hallazgos · ${s.unverified} NO VERIFICADO (se cuenta aparte)`}
      table={{ caption: 'Estado de la revisión', head: ['Estado', 'Hallazgos', 'Porcentaje'], rows: [...s.parts.map((p) => [p.label, p.n, `${p.percent} %`]), ['NO VERIFICADO (aparte)', s.unverified, '—']] }}
    >
      <SegmentedBar
        parts={s.parts}
        total={s.total}
        name="Estado de la revisión"
        tones={REVIEW_TONES}
        note={
          <li data-testid="legend-unverified">
            <span className="swatch tone-unv" aria-hidden="true" />
            <span>NO VERIFICADO (aparte)</span> <strong>{s.unverified}</strong>
          </li>
        }
      />
    </ChartFrame>
  );
}

/** P2 · «¿De dónde sale cada recomendación?» Visible también para la Empresa (solo datos de la estrategia, nada técnico). */
export function ProvenancePanel({ data }: { data: Provenance }) {
  if (data.rows.length === 0 || data.cols.length === 0) return null;
  return (
    <ChartFrame
      testId="chart-provenance"
      title="¿De dónde sale cada recomendación?"
      summary={`${countOf(data.rows.length, 'elemento', 'elementos')} derivan de ${countOf(data.cols.length, 'hallazgo aceptado', 'hallazgos aceptados')}.${data.unused.length > 0 ? ` Sin uso en la estrategia: ${data.unused.join(', ')}.` : ' Todos los hallazgos aceptados se usan.'}`}
      table={{ caption: 'Hallazgos de los que deriva cada elemento', head: ['Elemento', ...data.cols.map((c) => c.id)], rows: data.rows.map((r) => [`${r.kind === 'riesgo' ? 'Riesgo' : 'Fase'}: ${r.label}`, ...r.marks.map((m) => (m ? 'deriva' : '—'))]) }}
    >
      <DotMatrix data={data} />
    </ChartFrame>
  );
}

/** Une los elementos derivados con los hallazgos aceptados (`adopted`) para la matriz de procedencia. */
export function buildProvenance(derived: DerivedStrategy, adopted: readonly { id: string; title: string; verified: boolean }[]): Provenance {
  const decisions: Record<string, Decision> = Object.fromEntries(adopted.map((a) => [a.id, { state: 'accepted' } as Decision]));
  const items = [
    ...derived.risks.map((r) => ({ id: r.id, label: r.label, kind: 'riesgo' as const, derivedFrom: r.derivedFrom })),
    ...derived.route.map((r) => ({ id: r.id, label: r.label, kind: 'fase' as const, derivedFrom: r.derivedFrom })),
  ];
  return provenanceMatrix(items, adopted, decisions);
}

export function titleOf(id: string, findings?: readonly { id: string; title: string }[]): string {
  return (findings ?? DIAGNOSIS.findings).find((f) => f.id === id)?.title ?? id;
}

const RISK_TONES = { alto: 'low', medio: 'warn', bajo: 'ok' };

/** P2 · «¿Qué tan graves son los riesgos?» */
export function RiskLevelPanel({ risks }: { risks: readonly { level?: 'alto' | 'medio' | 'bajo' | undefined }[] }) {
  const s = riskLevelSegments(risks);
  if (s.total === 0) return null;
  return (
    <ChartFrame
      testId="chart-risk-levels"
      title="Nivel de gravedad: ¿cuáles pesan más?"
      summary={`${countOf(s.total, 'riesgo', 'riesgos')}: ${s.parts.map((p) => `${p.n} ${p.label.toLowerCase()}`).join(', ')}${s.noLevel > 0 ? `; ${s.noLevel} sin nivel` : ''}.`}
      table={{ caption: 'Riesgos por nivel', head: ['Nivel', 'Riesgos'], rows: [...s.parts.map((p) => [p.label, p.n]), ...(s.noLevel > 0 ? [['Sin nivel', s.noLevel]] : [])] }}
    >
      <SegmentedBar parts={s.parts} total={s.total} name="Riesgos por nivel" tones={RISK_TONES} />
    </ChartFrame>
  );
}

/** P3 · Líder: «¿En qué etapa están los proyectos?» */
export function StagePanel({ state }: { state: PersistedState }) {
  const stages = allProjects(state.createdProjects).map((p) => {
    const company = companyFor(p, state.createdProjects);
    const ps = state.projects[p.id]!;
    const count = ps.mode === 'real' ? (ps.serverFiles ?? []).length : buildEvidenceItems(p, company.name, ps.localFiles).length;
    return projectProgress({ evidenceCount: count, diagnosis: ps.diagnosis.status, strategy: ps.strategy.status }).stage;
  });
  const s = stageSegments(stages);
  return (
    <ChartFrame
      testId="chart-stages"
      title="Proyectos por etapa: ¿dónde está el trabajo?"
      summary={`${countOf(s.total, 'proyecto', 'proyectos')}: ${s.parts.map((p) => `${p.n} en ${p.label}`).join(', ') || 'ninguno'}.`}
      table={{ caption: 'Proyectos por etapa', head: ['Etapa', 'Proyectos'], rows: s.parts.map((p) => [p.label, p.n]) }}
    >
      <SegmentedBar parts={s.parts} total={s.total} name="Proyectos por etapa" />
    </ChartFrame>
  );
}

/** P3 · Líder: «¿Qué proyectos están más maduros?» Reales en acento; simulados en gris «ilustrativo». */
export function MaturityProjectsPanel({ state }: { state: PersistedState }) {
  const rows = allProjects(state.createdProjects).map((p) => ({ id: p.id, name: companyFor(p, state.createdProjects).name, mode: state.projects[p.id]?.mode === 'real' ? ('real' as const) : ('simulated' as const), index: projectMaturity(state, p.id) }));
  const m = maturityByProject(rows);
  return (
    <ChartFrame
      testId="chart-maturity-projects"
      title="Madurez por proyecto: ¿quién va adelante?"
      summary={m.bars.length === 0 ? 'Ningún proyecto tiene diagnóstico emitido con nivel.' : `${countOf(m.bars.length, 'proyecto', 'proyectos')} con nivel (de 5). Los simulados son ilustrativos.${m.withoutLevel.length > 0 ? ` Sin nivel: ${m.withoutLevel.length}.` : ''}`}
      table={{ caption: 'Madurez por proyecto', head: ['Proyecto', 'Origen', 'Nivel (de 5)'], rows: [...m.bars.map((b) => [b.name, b.illustrative ? 'ilustrativo' : 'estimado por IA', formatDecimal(b.value)]), ...m.withoutLevel.map((x) => [x.name, '—', 'Sin nivel'])] }}
    >
      <RankedBars bars={m.bars} name="Madurez por proyecto" />
    </ChartFrame>
  );
}

/** P3 · Consultor y Líder: «¿Cómo trabajó el agente?» Solo roles internos: la Empresa no lo tiene en el DOM. */
export function TraceSummaryPanel({ run }: { run: Partial<TraceSummary> }) {
  const role = useAppState().state.session.role;
  const availability = useAvailability();
  if (!canSeeTrace(role)) return null;
  const cap = availability.state === 'available' ? (availability.health.limits?.maxIterations ?? null) : null;
  const t = traceSummary(run, cap);
  const max = Math.max(1, ...t.tools.map((x) => x.n));
  return (
    <ChartFrame
      testId="chart-trace-summary"
      title="Resumen de la traza: ¿cuánto trabajó el agente?"
      summary={`${t.tools.reduce((a, x) => a + x.n, 0)} llamadas a herramientas, ${t.iterations} iteraciones${t.cap !== null ? ` de ${t.cap}` : ''}, ${t.failures} verificaciones fallidas${t.tokens !== null ? `, ${t.tokens} tokens` : ''}.`}
      table={{ caption: 'Resumen de la traza', head: ['Dato', 'Valor'], rows: [...t.tools.map((x) => [`Llamadas: ${x.name}`, x.n]), ['Iteraciones', t.cap !== null ? `${t.iterations} de ${t.cap}` : String(t.iterations)], ['Verificaciones fallidas', t.failures], ['Tokens', t.tokens ?? 'no disponible']] }}
    >
      <div className="trace-grid">
        <ul className="ranked trace-bars list-plain" aria-label="Llamadas por herramienta">
          {t.tools.length === 0 && <li className="subtitle">Sin llamadas registradas.</li>}
          {t.tools.map((x) => (
            <li key={x.name} className="ranked-row">
              <span className="ranked-name">{x.name}</span>
              <span className="ranked-track" role="img" aria-label={`${x.name}: ${x.n} llamadas`} data-tip={`${x.name}: ${x.n}`} tabIndex={0}>
                <span className="ranked-fill" style={{ width: `${(x.n / max) * 100}%` }} />
              </span>
              <span className="ranked-value">{x.n}</span>
            </li>
          ))}
        </ul>
        <div className="trace-figures">
          <div className="trace-figure">
            <span className="figure-label">Iteraciones{t.cap !== null ? ` (tope ${t.cap})` : ''}</span>
            <Meter value={t.iterations} max={t.cap} percent={t.iterationsPercent} label="Iteraciones" />
          </div>
          <div className="trace-figure">
            <span className="figure-label">Verificaciones fallidas</span>
            <strong>{t.failures}</strong>
          </div>
          <div className="trace-figure">
            <span className="figure-label">Tokens</span>
            <strong>{t.tokens ?? '—'}</strong>
          </div>
        </div>
      </div>
    </ChartFrame>
  );
}


