# Guía de arranque y validación (Fase 1)

Cómo ejecutar la demo y comprobar de punta a punta que funciona. Es una guía de validación, no código de implementación: los detalles están en [data-model.md](./data-model.md), [contracts/routes.md](./contracts/routes.md) y [contracts/persisted-state.md](./contracts/persisted-state.md). Los comandos existirán cuando se implemente el Lote 1.

## Requisitos previos

- Node 22.12 o superior (verificado con v26.13.0 en WSL) y npm.
- El Chromium de Playwright revisión 1248 ya instalado (verificado en `~/.cache/ms-playwright/`); si no, `npx playwright install chromium`.
- Una lista local de nombres reales a vetar en `.local/denylist.txt` (un nombre por línea; la carpeta `.local/` está en `.gitignore` y **no se commitea**). Sin ella, `npm run check` falla en local con instrucciones; en CI (variable `CI`) avisa y omite solo esa comprobación.

## Preparar y ejecutar

```bash
npm ci                 # versiones exactas del package-lock
npm run dev            # servidor de desarrollo local
npm run build          # compila a dist/
npm run preview        # sirve dist/ para probarlo como en producción
```

Para probar la publicación bajo subruta: `BASE_PATH=/mi-repo/ npm run build` y abrir la dirección con esa subruta.

## Comprobaciones automáticas

```bash
npm run typecheck      # tipos
npm test               # Vitest: reglas, derivación, rúbrica, archivos, persistencia, acceso, contrastes
npm run check          # nombres reales (src, docs, specs, .specify, .claude, dist si existe), referencias/ no versionada, colores fuera de tokens (incluidos public/*.svg), PDF en dist/. Antes de cada push: npm run build && npm run check
npm run test:e2e       # Playwright + axe: 320, 768 y 1280 px y recorrido P1
```

Resultado esperado: todo en verde; axe sin violaciones `wcag2a`, `wcag2aa`, `wcag22aa` en las pantallas del lote; el informe de red sin solicitudes a otros orígenes.

## Escenarios de validación manual

### Escenario 1 · Recorrido P1 (historias 1 a 4)
1. Abrir la aplicación: se ve «DEMO · datos ficticios» y las tres cuentas.
2. Entrar como **Consultor** → proyectos. Abrir el proyecto **P-A**.
3. En «Captura de evidencia»: leer el aviso de privacidad; agregar un `.pdf` válido y un `.exe` (rechazado con motivo).
4. «Generar diagnóstico»: indicador «Simulada», reporte con citas; abrir una cita y ver el extracto ficticio con el rótulo «Evidencia de ejemplo (ficticia)».
5. «Revisión»: aceptar, editar y rechazar hallazgos; comprobar «N de M revisados»; intentar emitir con pendientes (impedido); emitir.
6. Recargar la página **inmediatamente después de emitir** (sin esperar): el progreso sigue y el archivo propio muestra «Contenido no conservado en esta demo».
7. Abrir **P-D** (sin evidencia): «Generar diagnóstico» está bloqueado con explicación.

**Esperado**: FR-001 a FR-022, SC-002, SC-004.

### Escenario 2 · Estrategia y Líder (historias 5 y 6)
1. Con el diagnóstico de P-B emitido: abrir «Estrategia», pulsar «Generar estrategia» (simulación de 1,5 s «Simulada»), ver riesgos y ruta con «Deriva de…» (un hallazgo aceptado pero NO VERIFICADO no figura como respaldo); sector y mercado con «NO VERIFICADO · contenido ilustrativo».
2. «Enviar a revisión». Cambiar a **Líder** con el selector.
3. En el tablero, abrir la entrega, asignar nivel 1–5 a los 4 criterios (rotulados «Criterios de ejemplo…»), comentar, «Guardar calificación».
4. Verificar el promedio con coma decimal y «Meta del programa (ilustrativa): 4,2 de 5».
5. Volver a **Consultor**: ver la calificación; el diagnóstico sigue «Emitido».

**Esperado**: FR-023 a FR-033, SC-011, SC-012, SC-013.

### Escenario 3 · Roles y reglas de acceso (historia 1)
1. Como Consultor, escribir a mano `#/lider` en la barra de direcciones: se vuelve al inicio con el aviso de que esa vista es de otro rol.
2. Cambiar de rol a mitad de una revisión: al volver, el progreso se conserva.

**Esperado**: FR-002, FR-003.

### Escenario 4 · P3 (historias 7 y 8, si no se recortaron)
1. Como Consultor, en P-B abrir «Ver informe imprimible»; en la vista de impresión comprobar el aviso de demo y los rótulos; no aparecen calificaciones.
2. Como **Contacto**, ver el resumen y completar la encuesta; ver la confirmación «Registrada (simulada)».

**Esperado**: FR-034 a FR-036, FR-044 a FR-048, SC-014, SC-015.

### Escenario 5 · Accesibilidad y tamaños
1. Recorrer P1 y P2 solo con teclado (Tab, Enter, Espacio, flechas en los niveles de la rúbrica).
2. Revisar a 320, 768 y 1280 px: sin desplazamiento horizontal; controles ≥ 44 px.

**Esperado**: FR-037 a FR-040, SC-007 a SC-009. La revisión con lector de pantalla es manual y **NO VERIFICADO** hasta que alguien la haga.

### Escenario 6 · Privacidad y contenido
1. Abrir las herramientas del navegador (pestaña de red) y repetir el Escenario 1: ninguna solicitud lleva los archivos ni sale a otro origen.
2. `npm run build && npm run check`: sin nombres reales ni PDF en `dist/`.

**Esperado**: SC-003, SC-010.

## Antes de publicar (acciones de la persona responsable)

1. Crear el repositorio **público** en GitHub y añadir el remoto (hoy no hay remoto configurado).
2. Revisar `git status` y el historial: `referencias/` no debe aparecer.
3. Empujar `main`. En Settings → Pages → Source elegir **GitHub Actions**.
4. Esperar a que termine el workflow y abrir la dirección publicada; repetir el Escenario 1 en ella.
