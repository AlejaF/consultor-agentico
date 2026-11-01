# Registro de decisiones

## Estado de la sesión

- **Lote cerrado**: L2 (Evidencia), código y verificaciones del agente. Pendientes de la persona: T018 a T022 (L1, si aún no se cerraron), T034 y T035 (L2).
- **L1**: inicio 15:34, fin 15:48 (UTC-5); unos 12 min de agente (ver abajo).
- **L2 (agente)**: inicio 16:06:58, fin 16:18 (UTC-5). Tiempo total de reloj, sin pausas de la persona dentro del turno: unos 11 min. Plan: 1,25 h (NO VERIFICADO).
- **Punto de control**: acumulado de agente L1 + L2 ≈ 0,4 h. El límite de L3 (≤ 7,0 h con revisiones) se cumple con holgura.
- **Qué sigue**: revisión humana de L2 (T034), commit y push (T035). Después, L3 (Diagnóstico y revisión), que cierra todo P1.

## Decisiones de L1

- `passWithNoTests: true` se puso de forma provisional en `vite.config.ts` para el primer despliegue (T003), cuando aún no había pruebas. **Ya se retiró** (T017): ahora hay 86 pruebas unitarias.
- Enrutador propio con `useSyncExternalStore`; `navigate()` avisa de inmediato para que el cambio de rol y el cambio de ruta se rendericen juntos (evita un aviso espurio de «vista de otro rol» al usar el selector).
- `accessDecision(hash, role, ctx)` recibe un contexto con `consultorProjectIds` y `deliveryExists`. Es una forma concreta del `accessDecision(route, role)` del modelo de datos.
- `scripts/lib/tokens.mjs` contiene la lógica pura de `check-tokens`. El plan solo nombraba `check-tokens.mjs`; se separó para poder probarla sin ejecutar el script.
- `check-names` no imprime el término coincidente, solo archivo y línea, para no copiar un nombre real al registro de la terminal o de CI.
- Estados iniciales sembrados (P-B emitido, P-C enviado y calificado, equipos del Líder) y catálogos de hallazgos y criterios quedan **vacíos en L1** y se completan en L3 y L4, como indica T010. Al añadirlos se revisa `SCHEMA_VERSION`.
- Tras «Restablecer demo» el estado inicial se vuelve a guardar por el flujo normal (equivale al estado borrado).
- Tipografía: Plus Jakarta Sans propia (OFL-1.1). **NO VERIFICADO** que coincida con las referencias.
- Playwright usa el Chromium ya instalado (revisión 1248) y `vite preview`; las capturas de evidencia se generan con `EVIDENCIA=1 npx playwright test capturas` y se guardan en `docs/evidencia/capturas/<lote>/`.

## Verificación de L1 (2026-11-01)

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | sin errores |
| `npm test` | 5 archivos, 86 pruebas en verde (las 5 suites se vieron fallar antes de implementar) |
| `npm run build` | correcto; JS de 74,1 kB comprimidos (meta < 150 kB, NO VERIFICADO) |
| `BASE_PATH=/mi-repo/ npm run build` + `vite preview` | HTML, JS, CSS, fuentes, favicon y emblema con 200 bajo `/mi-repo/` |
| `npm run check` con lista | OK |
| `check-names` sin lista | local: falla con instrucciones (salida 1); con `CI`: avisa y omite solo esa comprobación |
| `npm run test:e2e` | 42 pruebas en verde (14 por ancho: 320, 768 y 1280); axe sin violaciones |

## Decisiones de L2

- **Avance de captura**: cada pregunta respondida es un paso y tener al menos un elemento de evidencia es un paso más (`captureProgress`). El spec no define la fórmula; es una decisión de implementación.
- **Avance del proyecto**: tres fases de un tercio cada una (evidencia ≥ 1, diagnóstico emitido, estrategia enviada). La etapa actual es la primera fase sin completar. Estado: «Pendiente» sin nada hecho, «En curso» con avance, «Completado» con las tres fases.
- **Evidencia que cuenta para «Generar diagnóstico»**: cuenta todo elemento listado, también el que está «Procesando» (FR-015 habla de «al menos un elemento de evidencia»).
- **Clasificación de archivos propios**: `txt`, `vtt` y `srt` van a «Entrevistas y transcripciones»; `pdf` y `docx`, a «Documentos».
- **Orden de las validaciones de archivo**: formato, vacío, tamaño, nombre largo, nombre repetido. El nombre repetido no distingue mayúsculas y también se detecta dentro de la misma selección.
- **Nota «Contenido no conservado en esta demo»**: aparece solo en archivos que vienen del almacenamiento (tras recargar). Los agregados en la carga actual no la llevan, aunque su contenido tampoco se guarda. El registro de agregados vive en memoria (`src/state/session.ts`).
- **«Generar diagnóstico» bloqueado**: usa `aria-disabled` y no `disabled`, para que el teclado y el lector de pantalla lleguen al botón y oigan el motivo. El «enlace» hacia la carga es un botón que lleva el foco a «Elegir archivos» (los enlaces con hash cambiarían de ruta).
- **Desviación menor de T032**: los archivos de prueba (pdf, exe y vacío) se generan en memoria en `tests/e2e/fixtures/archivos.ts`, para no versionar un ejecutable aunque sea ficticio.
- **Prueba de teclado estable**: se vio una carrera (1 de ~12) al abrir el selector de archivos con Enter; se añadió un viaje de ida y vuelta al navegador antes de pulsar. Pasa 30 de 30.
- **Aviso «la nueva evidencia no se refleja…»**: está implementado, pero no tiene prueba e2e porque el estado «emitido» sembrado (P-B) se crea en L3. Pendiente de cubrir ahí.
- **Controles de 44 px**: el enlace «← Proyectos» pasó a ser un botón-enlace (`a.btn`) para cumplir FR-039.
- **Defecto corregido por las capturas**: en 320 px el botón «Quitar» se partía en dos líneas; ahora no se encoge.

## Verificación de L2 (2026-11-01)

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | sin errores |
| `npm test` | 10 archivos, 120 pruebas en verde (las 5 suites nuevas se vieron fallar antes de implementar) |
| `npm run build` | correcto; JS de 78,7 kB comprimidos (meta < 150 kB, NO VERIFICADO); también con `BASE_PATH=/mi-repo/` |
| `npm run check` con lista | OK |
| `npm run test:e2e` | 84 pruebas en verde en 320, 768 y 1280 px (6 omitidas: las de capturas, que solo corren con `EVIDENCIA=1`) |
| Red (SC-003) | 0 solicitudes a otros orígenes y 0 con método distinto de GET o con cuerpo, incluida una carga de 3 archivos y una recarga |
| axe | sin violaciones en Proyectos y en Captura de evidencia (incluido con rechazos visibles) a 3 anchos |

## Lista de pulido (para L6)

Observaciones de la revisión humana de L1. No se aplican ahora; se atienden en la pasada de pulido de L6 (T095). Cualquier cambio de comportamiento se corrige primero en el spec.

1. Separar «Restablecer demo» de la navegación lateral: es una acción destructiva y no debe quedar junto a los enlaces de navegación.
2. Dar estilo al texto «Estás como…» de la barra lateral (hoy es texto plano).
3. El ingreso a 1280 px es sobrio y podría acercarse más al estilo de las referencias.
4. La barra lateral queda casi vacía en el inicio del Consultor.
