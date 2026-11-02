# Escenarios de `quickstart.md`: qué se comprobó y qué no

Fecha: 2026-11-01. **Ninguno de estos escenarios se ejecutó a mano**: se indica qué prueba automática cubre cada paso y qué queda para una persona. Nada de esto sustituye la comprobación manual (T093) ni la prueba en la dirección publicada (T099).

| Escenario | Cubierto automáticamente por | Pendiente (manual / persona) |
|---|---|---|
| 1 · Recorrido P1 (historias 1 a 4) | `tests/e2e/p1-journey.spec.ts` (ingreso, carga válida y rechazada, generación, cita abierta, aceptar/editar/rechazar, emisión, recarga inmediata); `evidence.spec.ts` (P-D bloqueado, «Contenido no conservado en esta demo») | Repetirlo a mano en la dirección publicada (T099). |
| 2 · Estrategia y Líder (historias 5 y 6) | `tests/e2e/strategy-leader.spec.ts` (generar, «Deriva de…», NO VERIFICADO excluido, enviar, cambiar a Líder, calificar con teclado, promedio con coma y meta, el Consultor ve la calificación, diagnóstico sigue «Emitido») | Medir el tiempo de calificación con una persona (SC-011). |
| 3 · Roles y reglas de acceso (historia 1) | `shell.spec.ts` («abrir a mano #/lider como Consultor…»), `tests/unit/access.test.ts`, `access.roles.test.ts`, `nav.spec.ts`, `ajustes7.spec.ts` | — |
| 4 · P3 (historias 7 y 8) | **No aplica**: informe imprimible y encuesta no construidos (pendiente de decisión al cerrar L6). La vista de la Empresa muestra hoy un mensaje de «Vista no disponible» (`ajustes7.spec.ts`). | Decisión de la persona (T100). |
| 5 · Accesibilidad y tamaños | `matrix.spec.ts` (axe, 44 px y sin desplazamiento horizontal a 320, 768 y 1280 px); pruebas con solo teclado en `evidence.spec.ts`, `nav.spec.ts` y `strategy-leader.spec.ts` | Revisión manual de teclado y lector de pantalla (`revision-manual.md`, T093): **NO VERIFICADO**. |
| 6 · Privacidad y contenido | `evidence.spec.ts` y `p1-journey.spec.ts` (sin solicitudes de red con los archivos ni a otros orígenes); `npm run build && npm run check` (sin nombres reales ni PDF en `dist/`) | Revisión humana del contenido (T097) y `git ls-files referencias` vacío (T098). |
