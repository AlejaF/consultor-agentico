# Evidencia automática de la demo

- **Fecha de generación**: 2026-11-01 (las salidas de axe llevan la fecha en UTC: 2026-11-02).
- **Versiones**: Node 26.13.0 (local), Playwright 1.64.1 (Chromium), `@axe-core/playwright` 4.14.0 (axe-core 4.14.0), Vite 8.3.5, Vitest 5.0.5.
- **Comando exacto** (regenera todo lo de esta carpeta):

```bash
EVIDENCIA=1 npx playwright test
```

Resultado de la última corrida: 375 pruebas pasadas y 15 omitidas (pruebas que solo aplican a un ancho concreto). Las pruebas unitarias (`npm test`) son 232.

## Qué cubre

- **Matriz transversal** (`tests/e2e/matrix.spec.ts`): todas las pantallas existentes de los tres roles a **320, 768 y 1280 px**: axe con las etiquetas `wcag2a`, `wcag2aa` y `wcag22aa` sin violaciones; foco en el `h1` y título del documento al cambiar de ruta; sin desplazamiento horizontal; todos los controles visibles de al menos 44 × 44 px.
- **Rótulos** (`tests/e2e/labels.spec.ts`): «DEMO · datos ficticios» en el 100 % de las pantallas existentes; «Simulada» y «NO VERIFICADO» donde corresponden.
- **Subruta de publicación** (`tests/e2e/base-path.spec.ts`): compila con `BASE_PATH=/mi-repo/`, sirve bajo esa subruta y comprueba que no hay recursos rotos.
- Las demás pruebas de cada historia (`tests/e2e/`, `tests/unit/`), que se ejecutan con el mismo comando.

## Qué NO cubre (**NO VERIFICADO**)

- Axe **no automatiza todo WCAG 2.2 AA**: detecta solo una parte de los criterios. «Cero violaciones» no significa «cumple WCAG». Las salidas guardadas incluyen los elementos «por revisar a mano» que axe no pudo decidir (hoy, ninguno).
- Teclado y lector de pantalla **no se han revisado a mano**: ver `revision-manual.md` (sin completar).
- Solo se prueba Chromium; no se probaron Firefox ni Safari ni dispositivos reales.
- Solo se prueban los anchos 320, 768 y 1280 px (no 1920 px ni anchos intermedios).
- No se prueban las pantallas aún no construidas (informes, encuesta y resumen del Contacto de la empresa).
- Las pruebas con usuarios **no se han hecho**: ver `pruebas-usuarios.md`.

## Índice

| Qué | Dónde |
|---|---|
| Salida de axe por pantalla y ancho (un JSON cada una) | `axe/<pantalla>-<ancho>.json` y `axe/ingreso-<ancho>.json` |
| Capturas de cada pantalla existente por ancho (matriz) | `capturas/320/`, `capturas/768/`, `capturas/1280/` |
| Capturas del ingreso y del inicio de cada rol (L1; incluye la vista del Contacto de la empresa) | `capturas/L1/` |
| Capturas de proyectos y captura de evidencia (L2) | `capturas/L2/` |
| Capturas de diagnóstico y revisión (L3) | `capturas/L3/` |
| Capturas de estrategia, tablero del Líder y calificación (L4; el aviso por ruta desconocida está en `tablero-aviso-ruta-desconocida-*`) | `capturas/L4/` |
| Capturas de los ajustes F a I (pestañas de cada rol, ventana de emisión, banner «Emitido», pilar con NO VERIFICADO) | `capturas/ajustes/` |
| Capturas de L6c: diálogo de «Restablecer demo» y calificación guardada sin comentario («Sin comentario»), vista del Líder y del Consultor | `capturas/L6c/` |
| Lista de comprobación manual de teclado y lector de pantalla (sin completar) | `revision-manual.md` |
| Checklist de criterios de éxito SC-001 a SC-015 | `sc-checklist.md` |
| Guion y tabla de pruebas con usuarios (sin completar) | `pruebas-usuarios.md` |
| Escenarios de `quickstart.md` y su correspondencia con pruebas | `quickstart-resultados.md` |
