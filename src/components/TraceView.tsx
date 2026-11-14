import { useId } from 'react';
import type { TraceStepSummary, TraceSummary } from '../state/types';

type Run = Pick<TraceSummary, 'steps'> & Partial<Omit<TraceSummary, 'steps'>>;

function argText(name: string, args: unknown): string {
  const a = (args ?? {}) as Record<string, unknown>;
  if (name === 'buscar_en_evidencia' && typeof a.consulta === 'string') return `consulta: «${a.consulta}»`;
  if (name === 'registrar_hallazgo' && typeof a.titulo === 'string') return `hallazgo: «${a.titulo}»${typeof a.pilar === 'string' ? ` (${a.pilar})` : ''}`;
  if (name === 'declarar_informacion_faltante' && typeof a.pilar === 'string') return `pilar: ${a.pilar}`;
  const t = JSON.stringify(args ?? {});
  return t.length > 160 ? `${t.slice(0, 160)}…` : t;
}

const RESOLUTION: Record<string, string> = {
  corregida: 'El agente la corrigió y se verificó.',
  descartada: 'Se descartaron las citas que no se pudieron verificar.',
  no_verificado: 'El hallazgo quedó NO VERIFICADO.',
};

function stepLine(s: TraceStepSummary): { key: string; text: string } | null {
  switch (s.type) {
    case 'tool':
      return { key: 'tool', text: `Herramienta ${s.name} — ${argText(s.name, s.args)} → ${s.resultSummary}` };
    case 'tool_error':
      return { key: 'error', text: `Error de herramienta ${s.name}: ${s.error}` };
    case 'verification': {
      if (s.ok && !s.resolution) return null; // verificación sin novedad: no se lista
      const title = s.findingTempId.split('|')[1] ?? s.findingTempId;
      if (s.ok) return { key: 'verif', text: `Verificación de «${title}»: ${RESOLUTION[s.resolution ?? ''] ?? 'correcta'}` };
      return { key: 'verif-fail', text: `Verificación fallida de «${title}»: ${s.reason ?? 'la cita no aparece en el archivo'}${s.resolution ? ` ${RESOLUTION[s.resolution]}` : ' Se pidió al agente corregirla.'}` };
    }
    case 'warning':
      return { key: 'warning', text: `Aviso: ${s.message}` };
    case 'model_error':
      return { key: 'error', text: `Error del proveedor (${s.category}): ${s.message}` };
  }
}

/** «Traza del agente» (AG-009, SC-A3): herramientas con su consulta, verificaciones fallidas y su resolución, modelo, tokens y errores. */
export function TraceView({ run }: { run: Run }) {
  const uid = useId();
  const lines = run.steps.map((s, i) => ({ i, line: stepLine(s) })).filter((x): x is { i: number; line: { key: string; text: string } } => x.line !== null);
  const errors = run.errors ?? run.steps.flatMap((s) => (s.type === 'model_error' ? [{ category: s.category, message: s.message }] : []));
  return (
    <details className="card trace-view" data-testid="trace-view">
      <summary>Traza del agente</summary>
      <dl className="trace-facts" aria-label="Datos de la corrida">
        <div><dt>Modelo</dt><dd data-testid="trace-model">{run.model ?? 'no disponible'}</dd></div>
        {run.iterations !== undefined && <div><dt>Iteraciones</dt><dd>{run.iterations}{run.partial ? ' (resultado parcial)' : ''}</dd></div>}
        {run.tokens && <div><dt>Tokens</dt><dd data-testid="trace-tokens">entrada {run.tokens.input} · salida {run.tokens.output} · total {run.tokens.total}</dd></div>}
        {run.toolCounts && <div><dt>Herramientas usadas</dt><dd>{Object.entries(run.toolCounts).map(([k, v]) => `${k} ×${v}`).join(', ') || 'ninguna'}</dd></div>}
        {run.verificationFailures !== undefined && <div><dt>Verificaciones fallidas</dt><dd data-testid="trace-verif-fail">{run.verificationFailures}</dd></div>}
        <div><dt>Errores</dt><dd data-testid="trace-errors">{errors.length === 0 ? 'ninguno' : errors.map((e) => `${e.category}: ${e.message}`).join(' · ')}</dd></div>
      </dl>
      <h3 id={`${uid}-pasos`}>Pasos</h3>
      {lines.length === 0 ? (
        <p className="subtitle">Sin pasos registrados.</p>
      ) : (
        <ol aria-labelledby={`${uid}-pasos`} className="trace-steps">
          {lines.map(({ i, line }) => (
            <li key={i} data-step={line.key}>
              {line.text}
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
