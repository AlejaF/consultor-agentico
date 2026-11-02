# Consultor Agéntico · versión de demostración

> **DEMO · datos ficticios.** Esto es una demostración navegable para probar el recorrido con personas. No es el sistema real: no hay inteligencia artificial, ni servidor, ni cuentas reales. Todas las empresas, personas, cifras y textos son inventados.

## Qué es y qué valida

Una sola aplicación web (página estática) que une las dos interfaces de referencia —la de estudiantes y la del profesorado— con acceso por rol, para recorrer el flujo **Evidencia → Diagnóstico → Estrategia**:

- **Consultor**: carga evidencia, genera y revisa el diagnóstico (acepta, edita o rechaza cada hallazgo), lo emite y genera y envía la estrategia.
- **Líder**: ve un tablero de equipos ficticios, abre las entregas y las califica con una rúbrica de ejemplo.
- **Contacto de la empresa**: la vista de este rol **no está disponible todavía** (ver «Qué no se construyó»).

La cabecera de toda pantalla lleva la marca, «Inicio» (vuelve al ingreso **sin borrar** tu progreso), el selector «Rol activo» (al cambiar de rol vas a la pantalla de inicio del nuevo rol y tu progreso se conserva) y «Restablecer demo» (borra todo el progreso y vuelve a los datos de ejemplo, con confirmación; si tienes la demo abierta en otras pestañas del mismo navegador, también se restablecen). En la calificación, el comentario es opcional.

Valida, con personas reales, si el recorrido se entiende, si queda claro qué es simulado y si el flujo de revisión y calificación tiene sentido. No valida la calidad de ningún análisis, porque no hay análisis.

## Qué es simulado, qué es real y qué queda fuera

| Elemento | ¿Real o simulado? |
|---|---|
| Ingreso por rol y control de acceso | **Simulado**: sin autenticación. El rol solo ordena la experiencia; cualquiera puede cambiar de rol. No protege datos. |
| Diagnóstico, hallazgos, índice de madurez | **Simulado**: contenido preparado, igual para todos los proyectos. Rótulo «Simulada». |
| Citas y extractos | **Simulado**: extractos ficticios. Rótulo «Evidencia de ejemplo (ficticia)». |
| Generación del diagnóstico y de la estrategia | **Simulada**: una espera de 1,5 s rotulada «Simulada». |
| Estrategia | **Simulada**, pero la trazabilidad («Deriva de…») **sí se calcula** con las decisiones reales de la persona: solo cuentan los hallazgos aceptados o editados y verificados. |
| Análisis de sector y de mercado | **Simulado e ilustrativo**: «NO VERIFICADO · contenido ilustrativo». |
| Carga de archivos | **Real, solo local**: el navegador lee el nombre, el tipo y el tamaño para listarlo. **No se analiza ni se envía a ningún servidor.** Tras recargar, el contenido no se conserva («Contenido no conservado en esta demo»). |
| Decisiones de revisión y su efecto | **Real** dentro de la demo. |
| Calificación, promedio y comentarios | **Real** dentro de la demo (lógica real; criterios de ejemplo «pendientes de definir por el profesor»). |
| Meta del programa (4,2 de 5) | Cifra **ilustrativa, NO VERIFICADO**. |
| Progreso | **Real, solo local**: se guarda en este navegador (`localStorage`); no se comparte entre personas ni dispositivos. |
| Equipos, empresas y cifras del tablero | **Ficticios**. |

### Formatos de archivo permitidos

PDF, DOCX, TXT, VTT, SRT y XLSX, hasta 25 MB y nombres de hasta 150 caracteres. Los XLSX se tratan como documentos y solo se listan («Cargado localmente · no analizado»). **El audio no está permitido**: transcribirlo es procesamiento del sistema completo.

### Qué significa «NO VERIFICADO»

Se usa en dos sentidos: (1) un **hallazgo** con respaldo insuficiente se marca «NO VERIFICADO»; puede aceptarse, pero **no cuenta como respaldo de la estrategia**; (2) en este README y en `docs/`, una **afirmación** que nadie ha comprobado todavía (ver la lista más abajo).

## Qué no se construyó o se recortó

- **Vista del Contacto de la empresa y encuesta simulada**: no incluido todavía (pendiente de decisión al cerrar esta etapa). Hoy ese rol muestra un mensaje de «Vista no disponible».
- **Informe imprimible** del diagnóstico y la estrategia: no incluido todavía (pendiente de decisión al cerrar esta etapa).
- Fuera de la demo por pertenecer al sistema completo: IA real, transcripción de audio, lectura del contenido de los archivos, cuentas y permisos reales, envío de correos, almacenamiento compartido, administración de la plataforma, exportaciones oficiales, fuentes reales de sector y mercado, estrategia conversacional por etapas, portafolio de casos de uso y la devolución de un entregable para corregirlo (el Líder solo califica).

## Límites conocidos y cosas NO VERIFICADO

- **NO VERIFICADO** — SC-001 (completar el recorrido P1 en 10 minutos o menos) y SC-005 («9 de cada 10» identifican lo simulado): no se han medido con personas. Con 2 o 3 participantes el resultado solo podrá ser **indicativo (n = …)**, nunca concluyente. Ver `docs/evidencia/pruebas-usuarios.md`.
- **NO VERIFICADO** — La revisión manual con teclado y con lector de pantalla (`docs/evidencia/revision-manual.md`) no se ha hecho. Axe automatiza solo una parte de WCAG 2.2 AA: que axe no encuentre violaciones **no** equivale a cumplir WCAG.
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
npm run typecheck   # tipos
npm test            # Vitest: reglas de negocio (derivación, rúbrica, archivos, persistencia, acceso, contrastes)
npm run check       # nombres reales, referencias/ no versionada, colores fuera de los tokens, ningún PDF en dist/
npm run test:e2e    # Playwright + axe a 320, 768 y 1280 px
EVIDENCIA=1 npm run test:e2e   # además guarda capturas y salidas de axe en docs/evidencia/
```

**Playwright corre en local, no en CI.** El flujo de CI (GitHub Actions) ejecuta typecheck, pruebas unitarias, compilación y `check` (este último omite la lista local de nombres vetados, que no se versiona). Las pruebas de extremo a extremo y la evidencia se ejecutan a mano antes de cada commit.

Las capturas y los resultados de axe están en `docs/evidencia/` (ver su `README.md`). Las comprobaciones manuales y las pruebas con usuarios son tareas de una persona y siguen pendientes.

## Cómo se despliega

GitHub Actions compila con `BASE_PATH=/<nombre-del-repositorio>/` y publica `dist/` en GitHub Pages (`.github/workflows/`). La app usa rutas con `#` (`#/consultor`), así que no necesita configuración de servidor. Una prueba (`tests/e2e/base-path.spec.ts`) compila bajo una subruta y comprueba que no hay recursos rotos.

## Cómo se usó Spec Kit

El proyecto se construyó con desarrollo guiado por especificación (Spec Kit): **constitución → especificación → plan → tareas → implementación por lotes**, con revisión humana al cerrar cada lote y **commit y publicación hechos siempre por la persona** (nunca por el agente). Una divergencia con lo especificado se corrige primero en la especificación y después en el plan, las tareas y el código.

- Constitución: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- Especificación: [`specs/001-demo-consultor-agentico/spec.md`](specs/001-demo-consultor-agentico/spec.md)
- Plan: [`specs/001-demo-consultor-agentico/plan.md`](specs/001-demo-consultor-agentico/plan.md)
- Tareas: [`specs/001-demo-consultor-agentico/tasks.md`](specs/001-demo-consultor-agentico/tasks.md)
- Registro de decisiones y verificaciones: [`docs/decisiones.md`](docs/decisiones.md)

## Contenido, créditos y licencias

- Ningún nombre, marca, logo ni dato real: las empresas («Empresa Ficticia …») y las cuentas («… Demo») son inventadas. `npm run check` lo vigila con una lista local de nombres vetados que no se versiona. La carpeta `referencias/` (material de consulta) no se versiona ni se publica.
- Tipografía **Plus Jakarta Sans** (paquete `@fontsource-variable/plus-jakarta-sans`), bajo la licencia SIL Open Font License 1.1: [`public/licenses/OFL-PlusJakartaSans.txt`](public/licenses/OFL-PlusJakartaSans.txt) (también se publica con la app en `licenses/OFL-PlusJakartaSans.txt`).
- El emblema es un dibujo genérico creado para esta demo, sin relación con ninguna marca.
