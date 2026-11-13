# Consultor Agéntico · versión de demostración

> **DEMO · datos ficticios.** Esto es una demostración navegable. Permite recorrer el flujo Evidencia → Diagnóstico → Estrategia con cada rol. No es el sistema real: no hay inteligencia artificial, ni servidor, ni cuentas reales. Todas las empresas, personas, cifras y textos son inventados.

## Qué es y qué valida

Una sola aplicación web (página estática) que une las dos interfaces de referencia —la de estudiantes y la del profesorado— con acceso por rol, para recorrer el flujo **Evidencia → Diagnóstico → Estrategia**:

- **Consultor**: carga evidencia, genera y revisa el diagnóstico (acepta, edita o rechaza cada hallazgo), lo emite y genera y envía la estrategia.
- **Líder**: ve un tablero de equipos ficticios, abre las entregas y las califica con una rúbrica de ejemplo.
- **Empresa**: ve el inicio de su proyecto (ruta de adopción, próximo paso, actividad de ejemplo), abre el informe de diagnóstico en solo lectura y responde una encuesta simulada de 3 preguntas.

Las pantallas «Proyectos» y «Tablero» avisan que los proyectos, calificaciones y entregas iniciales son ejemplos precargados que «Restablecer demo» recupera.

La cabecera de toda pantalla lleva la marca, «Inicio» (vuelve al ingreso **sin borrar** tu progreso), el selector «Rol activo» (al cambiar de rol vas a la pantalla de inicio del nuevo rol y tu progreso se conserva) y «Restablecer demo» (borra todo el progreso y vuelve a los datos de ejemplo, con confirmación; si tienes la demo abierta en otras pestañas del mismo navegador, también se restablecen). En la calificación, el comentario es opcional.

Muestra si el recorrido se entiende, si queda claro qué es simulado y si el flujo de revisión y calificación tiene sentido. No valida la calidad de ningún análisis, porque no hay análisis real.

## Cómo se usó Spec Kit

El proyecto se construyó con desarrollo guiado por especificación (Spec Kit): **constitución → especificación → plan → tareas → implementación por lotes**, con revisión humana al cerrar cada lote. Una divergencia con lo especificado se corrige primero en la especificación y después en el plan, las tareas y el código.

- Constitución: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- Especificación: [`specs/001-demo-consultor-agentico/spec.md`](specs/001-demo-consultor-agentico/spec.md)
- Plan: [`specs/001-demo-consultor-agentico/plan.md`](specs/001-demo-consultor-agentico/plan.md)
- Tareas: [`specs/001-demo-consultor-agentico/tasks.md`](specs/001-demo-consultor-agentico/tasks.md)
- Registro de decisiones y verificaciones: [`docs/decisiones.md`](docs/decisiones.md)
- Qué se tomó de las interfaces de referencia y qué no: [`docs/cobertura-referencias.md`](docs/cobertura-referencias.md)

## Qué es simulado, qué es real y qué queda fuera

| Elemento | ¿Real o simulado? |
|---|---|
| Ingreso por rol y control de acceso | **Simulado**: sin autenticación. El rol solo ordena la experiencia; cualquiera puede cambiar de rol. No protege datos. |
| Diagnóstico, hallazgos, índice de madurez | **Simulado**: contenido preparado, igual para todos los proyectos. Rótulo «Simulada». |
| Citas y extractos | **Simulado**: extractos ficticios. Rótulo «Evidencia de ejemplo (ficticia)». |
| Generación del diagnóstico y de la estrategia | **Simulada**: una espera de 1,5 s rotulada «Simulada». |
| Estrategia | **Simulada**, pero la trazabilidad («Deriva de…») **sí se calcula** con las decisiones reales de la persona: solo cuentan los hallazgos aceptados o editados y verificados. |
| Carga de archivos | **Real, solo local**: el navegador lee el nombre, el tipo y el tamaño para listarlo. **No se analiza ni se envía a ningún servidor.** Tras recargar, el contenido no se conserva («Contenido no conservado en esta demo»). |
| Decisiones de revisión y su efecto | **Real** dentro de la demo. |
| Encuesta de la Empresa | **Simulada y solo local**: 3 preguntas, rotulada «Simulada»; se guarda en este navegador, no se envía a nadie y «Restablecer demo» la borra. |
| Análisis de sector y de mercado | **Simulado e ilustrativo**: resumen y puntos clave «NO VERIFICADO · contenido ilustrativo»; la «Implicación para esta empresa» sí se deriva de los hallazgos aceptados o editados y verificados. Sin fuentes en la demo. |
| Datos de la empresa | **Ficticios**, de solo lectura, en la captura de evidencia. La demo no lee el contenido de los archivos, por eso no ofrece una lista de documentos que se marque según lo que subas. |
| Índice de madurez (diagnóstico, informe, vista de la Empresa y tablero del Líder) | **Valor ilustrativo y ficticio, sembrado por proyecto** en los datos de ejemplo (Beta 2,4; Gamma 3,1; Zeta 1,8; Eta 2,8; Épsilon y el proyecto que se genera en la sesión, 2,4 de la plantilla). **No se calcula** de los hallazgos ni de puntajes por pilar (no existen). El tablero muestra el promedio por equipo y el de todos los diagnósticos emitidos (2,5 con los datos de ejemplo). |
| Fechas y horas | Se muestran siempre en hora de Bogotá (UTC−5), sea cual sea la zona del navegador. |
| Informe imprimible | **Real, solo local**: se arma en el navegador con las decisiones de la persona; no sale de él. El contenido que muestra sigue siendo simulado y rotulado. |
| Calificación, promedio y comentarios | **Real** dentro de la demo (lógica real; criterios de ejemplo «pendientes de definir por el profesor»). |
| Meta del programa (4,2 de 5) | Cifra **ilustrativa, NO VERIFICADO**. |
| Progreso | **Real, solo local**: se guarda en este navegador (`localStorage`); no se comparte entre personas ni dispositivos. |
| Equipos, empresas y cifras del tablero | **Ficticios**. |

### Formatos de archivo permitidos

PDF, DOCX, TXT, VTT, SRT y XLSX, hasta 25 MB y nombres de hasta 150 caracteres. Los XLSX se tratan como documentos y solo se listan («Cargado localmente · no analizado»). **El audio no está permitido**: transcribirlo es procesamiento del sistema completo.

### Qué significa «NO VERIFICADO»

Se usa en dos sentidos: (1) un **hallazgo** con respaldo insuficiente se marca «NO VERIFICADO»; puede aceptarse, pero **no cuenta como respaldo de la estrategia**; (2) en este README y en `docs/`, una **afirmación** que nadie ha comprobado todavía (ver la lista más abajo).

## Decisión sobre el alcance de P3 (2026-11-02)

Se incluyen L5a (informe imprimible) y L5b (vista de la Empresa y encuesta simulada), y tres ampliaciones de P3: el tablero del Líder con madurez y buscador (E), los datos de la empresa en la captura de evidencia (F), y el análisis de sector y de mercado de solo lectura (G). Quedó registrado en el spec, `tasks.md`, `docs/decisiones.md` y `docs/cobertura-referencias.md`, y la constitución se enmendó (1.0.1).

> **Constitución 2.0.0 (2026-11-11)**: el sitio publicado en GitHub Pages sigue siendo estático y funciona solo en modo Simulado. Se permite un backend local opcional (`server/`) que solo corre en el equipo de la persona y es el único lugar donde puede existir la clave de API del proveedor de IA; la clave nunca va en el repositorio, el historial, el frontend ni `dist/`. En modo IA real los documentos propios viven solo en memoria durante la sesión, todo contenido del modelo se rotula «Generado por IA (modelo X) · requiere revisión humana» y las citas se verifican por código. Nuevo principio IX «Seguridad y costo de la IA». Esta enmienda es solo de gobierno: el backend aún no está construido y lo descrito en este README sigue siendo la demo simulada.

## Alcance: qué se incluyó y qué se recortó

- **Vista de la Empresa y encuesta simulada** (historia 7): **incluida el 2026-11-02** (L5b). La Empresa Ficticia Beta ve su ruta de adopción en tres pasos, el próximo paso, una actividad de ejemplo, el informe de diagnóstico en solo lectura y una encuesta simulada de 3 preguntas que se guarda solo en el navegador.
- **Informe imprimible** (historia 8): **incluido** (lotes L6f y L6g). Desde un diagnóstico emitido, «Ver informe imprimible» abre una vista que se imprime o se guarda como PDF con la función del navegador; lleva «DEMO · datos ficticios» en cada página y los rótulos «Simulada» y «NO VERIFICADO». La impresión real en papel o PDF queda por revisar a mano (tarea T071).
- Qué se tomó de las interfaces de referencia y qué no (con resumen de conteos por estado): [`docs/cobertura-referencias.md`](docs/cobertura-referencias.md).
- Fuera de la demo por pertenecer al sistema completo: IA real, transcripción de audio, lectura del contenido de los archivos, cuentas y permisos reales, envío de correos, almacenamiento compartido, administración de la plataforma, exportaciones oficiales, fuentes reales de sector y mercado, estrategia conversacional por etapas, portafolio de casos de uso y la devolución de un entregable para corregirlo (el Líder solo califica).

## Límites conocidos y cosas NO VERIFICADO

- **No evaluado en esta versión de demostración** — SC-001 (completar el recorrido P1 en 10 minutos o menos) y SC-005 («9 de cada 10» identifican lo simulado) se mantienen como metas del spec; no hay ningún resultado y no se afirma ninguno.
- **NO VERIFICADO** — La revisión manual con **lector de pantalla** no se hizo (`docs/evidencia/revision-manual.md`). La revisión manual con **teclado** sí se hizo el 2026-11-02 en Chrome para Windows: todo funcionó salvo el foco visible del diálogo de «Restablecer demo», ya corregido. Axe automatiza solo una parte de WCAG 2.2 AA: que axe no encuentre violaciones **no** equivale a cumplir WCAG.
- **NO VERIFICADO** — La tipografía (Plus Jakarta Sans) es una aproximación a la de las referencias.
- **NO VERIFICADO** — Los tiempos y metas del plan (horas por lote, paquete menor de 150 kB comprimidos) son estimaciones; el tamaño medido está en `docs/evidencia/sc-checklist.md`.
- **NO VERIFICADO** — Conformidad legal sobre tratamiento de datos personales: no se ha evaluado. La demo no pide datos personales.
- Los datos viven solo en el navegador: borrar los datos del sitio o usar otro navegador reinicia la demo. Con el almacenamiento bloqueado la demo avisa y funciona en memoria.
- Un hallazgo editado o una calificación guardada no se pueden deshacer, salvo con «Restablecer demo» (botón «Restablecer demo» de la cabecera; pide una confirmación).

## Cómo ejecutarla

Requisitos: Node 22.12 o superior y npm (verificado con Node 26.13 en local y Node 24 en CI).

```bash
npm ci            # instala las versiones exactas
npm run dev       # servidor de desarrollo
npm run build     # compila a dist/
npm run preview   # sirve dist/ como en producción
```

Para probar la publicación bajo una subruta: `BASE_PATH=/mi-repo/ npm run build`.

## Cómo se prueba

```bash
npm run typecheck   # tipos de la app (es lo que corre el CI de Pages; no necesita server/)
npm test            # Vitest: reglas de negocio (derivación, rúbrica, archivos, persistencia, acceso, contrastes)
npm run typecheck:all  # app + servicio local (requiere `npm ci --prefix server`)
npm run test:all       # pruebas de la app + pruebas del servicio (tests/server)
npm run check:all   # typecheck:all + test:all + check, en un solo paso (local)
npm run check       # nombres reales, referencias/ no versionada, colores fuera de los tokens, ningún PDF en dist/
npm run test:e2e    # Playwright + axe a 320, 768 y 1280 px
EVIDENCIA=1 npm run test:e2e   # además guarda capturas y salidas de axe en docs/evidencia/
```

**Playwright corre en local, no en CI.** El flujo de CI (GitHub Actions) solo instala las dependencias de la raíz y ejecuta `typecheck`, `test`, compilación y `check` (este último omite la lista local de nombres vetados, que no se versiona). Las pruebas de extremo a extremo y la evidencia se ejecutan a mano antes de cada commit.

Las capturas y los resultados de axe están en `docs/evidencia/` (ver su `README.md`). La revisión manual de teclado se hizo el 2026-11-02; la del lector de pantalla **NO se hizo** (NO VERIFICADO); ver `docs/evidencia/revision-manual.md`.

## Cómo se despliega

GitHub Actions compila con `BASE_PATH=/<nombre-del-repositorio>/` y publica `dist/` en GitHub Pages (`.github/workflows/`). La app usa rutas con `#` (`#/consultor`), así que no necesita configuración de servidor. Una prueba (`tests/e2e/base-path.spec.ts`) compila bajo una subruta y comprueba que no hay recursos rotos.

## Contenido, créditos y licencias

- Ningún nombre, marca, logo ni dato real: las empresas («Empresa Ficticia …») y las cuentas («… Demo») son inventadas. `npm run check` lo vigila con una lista local de nombres vetados que no se versiona. La carpeta `referencias/` (material de consulta) no se versiona ni se publica.
- Tipografía **Plus Jakarta Sans** (paquete `@fontsource-variable/plus-jakarta-sans`), bajo la licencia SIL Open Font License 1.1: [`public/licenses/OFL-PlusJakartaSans.txt`](public/licenses/OFL-PlusJakartaSans.txt) (también se publica con la app en `licenses/OFL-PlusJakartaSans.txt`).
- El emblema es un dibujo genérico creado para esta demo, sin relación con ninguna marca.
