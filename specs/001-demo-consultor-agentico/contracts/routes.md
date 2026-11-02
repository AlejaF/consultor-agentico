# Contrato de rutas (en lugar de contratos de API)

La demo no tiene API ni servidor. Sus «interfaces» son las rutas por hash. El enrutador propio lee `location.hash`, la compara con esta tabla y aplica la regla de acceso. Todas las rutas empiezan por `#/`.

## Tabla de rutas

| Patrón | Rol permitido | Pantalla | Historia | Prioridad |
|---|---|---|---|---|
| `#/` | cualquiera | Ingreso: tres cuentas de demostración | US1 | P1 |
| `#/consultor` | `consultor` | Proyectos | US1 | P1 |
| `#/consultor/proyectos/:projectId/evidencia` | `consultor` | Captura de evidencia | US2 | P1 |
| `#/consultor/proyectos/:projectId/diagnostico` | `consultor` | Reporte de diagnóstico | US3 | P1 |
| `#/consultor/proyectos/:projectId/revision` | `consultor` | Panel de revisión y emisión | US4 | P1 |
| `#/consultor/proyectos/:projectId/estrategia` | `consultor` | Estrategia | US5 | P2 |
| `#/lider` | `lider` | Tablero | US6 | P2 |
| `#/lider/entregas` | `lider` | Entregas por revisar (lista; destino de «Entregas por revisar (n)» en la navegación) | US6 | P2 |
| `#/lider/entregas/:tipo/:projectId` | `lider` | Revisión y calificación de una entrega (`tipo` = `dx` diagnóstico o `st` estrategia) | US6 | P2 |
| `#/consultor/proyectos/:projectId/informe` | `consultor` | Informe imprimible | US8 | P3 |
| `#/lider/entregas/:tipo/:projectId/informe` | `lider` | Informe imprimible de la entrega (`dx`: solo diagnóstico; `st`: estrategia enviada con su diagnóstico) | US8 | P3 |
| `#/contacto` | `contacto` | Hoy: mensaje «Vista no disponible» (el resumen del proyecto es la historia 7, P3, pendiente de decisión) | US7 | P3 |
| `#/contacto/encuesta` | `contacto` | Encuesta simulada | US7 | P3 |

`:projectId` es `P-A`…`P-D` (proyectos del Consultor) o el de un equipo precargado; `:tipo` es `dx` (diagnóstico emitido) o `st` (estrategia enviada). La entrega queda identificada por **dos segmentos de ruta** (`:tipo/:projectId`), sin caracteres que codificar; en el estado equivale a la clave `dx/<projectId>` o `st/<projectId>`.

El Contacto ve siempre un único proyecto (el de su empresa ficticia, `P-B`), por eso sus rutas no llevan identificador.

## Inicio de cada rol

| Rol | Inicio |
|---|---|
| `consultor` | `#/consultor` |
| `lider` | `#/lider` |
| `contacto` | `#/contacto` |

## Regla de redirección (única; función pura `accessDecision(hash, role, state)`)

Se evalúa en este orden en cada cambio de hash y en la carga inicial:

| # | Condición | Resultado | Aviso |
|---|---|---|---|
| 1 | No hay rol activo y la ruta no es `#/` | ir a `#/` | ninguno |
| 2 | Hay rol activo y la ruta es `#/` | **mostrar el ingreso** (se llega con «Inicio»; no borra el estado; elegir una cuenta lleva a su inicio) | ninguno |
| 3 | La ruta es de otro rol | ir al inicio del rol activo | «Esa vista pertenece al rol *X*. Estás como *Y*.» (FR-003) |
| 4 | La ruta no existe, o `:projectId` no existe, o `:tipo` no es `dx` ni `st`, o la entrega aún no existe (`dx` sin diagnóstico emitido; `st` sin estrategia enviada), o el proyecto no es accesible para el rol | ir al inicio del rol activo | «No encontramos esa pantalla.» |
| 5 | Ruta válida del rol | mostrar | — |

Los avisos se anuncian en una región `aria-live` y se pueden cerrar.

## Bloqueos por orden de flujo (no son redirecciones)

| Pantalla | Condición de bloqueo | Qué se muestra |
|---|---|---|
| Estrategia (US5) | diagnóstico del proyecto no emitido | Pantalla con explicación y enlace a la revisión; sin botón «Generar estrategia» (FR-023) |
| Estrategia (US5) | diagnóstico emitido y estrategia sin generar | Pantalla con el botón «Generar estrategia» (simulación de 1,5 s «Simulada») y sin contenido de estrategia (FR-024) |
| Informe (US8) | diagnóstico no emitido | Pantalla con explicación y enlace a la revisión |
| Generar diagnóstico (US3) | proyecto sin evidencia | Botón deshabilitado con motivo y enlace a la captura (FR-015) |
| Panel de revisión (US4) | diagnóstico sin generar | Pantalla con enlace a «Generar diagnóstico» |
| Entrega del Líder ya calificada | entrega en estado `calificada` | Vista de solo lectura (FR-031) |

## Navegación lateral (FR-049)

| Rol | Elementos | Notas |
|---|---|---|
| Consultor | «Proyectos» (`#/consultor`); dentro de un proyecto (cualquier ruta con `:projectId`), un bloque con la empresa y 4 pasos: Evidencia, Diagnóstico, Revisión, Estrategia | Cada paso lleva su estado en texto: Pendiente, En curso, Completado, Bloqueado o Disponible (Estrategia con el diagnóstico emitido y sin generar). **Un paso Bloqueado enlaza a su pantalla, que explica el bloqueo; no redirige.** |
| Líder | «Tablero» (`#/lider`), «Entregas por revisar (n)» (`#/lider/entregas`) | `n` = entregas existentes sin calificación |
| Empresa | «Resumen» (`#/contacto`) y «Encuesta» (`#/contacto/encuesta`), **solo cuando existan sus pantallas** (`src/app/features.ts`); hoy, ninguno y sin barra | Mientras no exista su vista, el rol muestra un mensaje claro, sin menús vacíos ni enlaces rotos |

La navegación no incluye tarjeta de cuenta ni «Restablecer demo»: «Restablecer demo» es un botón de la cabecera (FR-006) y la cabecera lleva también «Inicio» y la marca, ambos hacia `#/` sin borrar el estado (FR-051). Bajo 1024 px la navegación es una barra de pestañas siempre visible bajo la cabecera (en la lista de proyectos del Consultor no hace falta). Al elegir un enlace, el foco pasa al `h1` de la nueva pantalla.

## Selector de rol

El selector (visible en todas las pantallas excepto el ingreso) cambia `session.role` y navega al inicio del nuevo rol **sin tocar el resto del estado** (FR-002). Si hay una edición sin guardar en la pantalla actual, pide confirmación antes de cambiar.

## Comportamiento al navegar

- Se actualiza el título del documento según la pantalla.
- El foco pasa al encabezado principal (`h1`) de la nueva pantalla y se anuncia el cambio.
- «Saltar al contenido» es el primer elemento enfocable de cada pantalla.
- Se usa solo `#/…` en los enlaces internos, de modo que funcione igual bajo cualquier subruta de publicación.

## Pruebas del contrato

- Unitarias: una prueba por cada fila de la regla de redirección y por cada patrón de ruta (coincidencia y parámetros).
- Unitarias (rutas de entrega): `#/lider/entregas/dx/P-B` coincide con `tipo=dx`, `projectId=P-B`; `#/lider/entregas/xx/P-B` y `#/lider/entregas/st/P-A` (sin estrategia enviada) redirigen con «No encontramos esa pantalla.»; el informe `…/informe` coincide y exige el mismo permiso.
- Playwright: intentar abrir a mano `#/lider` siendo Consultor y comprobar el aviso y la ruta final; cambiar de rol a mitad de revisión y comprobar que el progreso sigue ahí.
