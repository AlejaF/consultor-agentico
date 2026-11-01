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
| `#/lider/entregas/:tipo/:projectId` | `lider` | Revisión y calificación de una entrega (`tipo` = `dx` diagnóstico o `st` estrategia) | US6 | P2 |
| `#/consultor/proyectos/:projectId/informe` | `consultor` | Informe imprimible | US8 | P3 |
| `#/lider/entregas/:tipo/:projectId/informe` | `lider` | Informe imprimible de la entrega | US8 | P3 |
| `#/contacto` | `contacto` | Resumen del proyecto | US7 | P3 |
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
| 2 | Hay rol activo y la ruta es `#/` | ir al inicio del rol | ninguno |
| 3 | La ruta es de otro rol | ir al inicio del rol activo | «Esa vista pertenece al rol *X*. Estás como *Y*.» (FR-003) |
| 4 | La ruta no existe, o `:projectId` no existe, o `:tipo` no es `dx` ni `st`, o la entrega aún no existe (`dx` sin diagnóstico emitido; `st` sin estrategia enviada), o el proyecto no es accesible para el rol | ir al inicio del rol activo | «No encontramos esa pantalla.» |
| 5 | Ruta válida del rol | mostrar | — |

Los avisos se anuncian en una región `aria-live` y se pueden cerrar.

## Bloqueos por orden de flujo (no son redirecciones)

| Pantalla | Condición de bloqueo | Qué se muestra |
|---|---|---|
| Estrategia (US5) | diagnóstico del proyecto no emitido | Pantalla con explicación y enlace a la revisión (FR-023) |
| Informe (US8) | diagnóstico no emitido | Pantalla con explicación y enlace a la revisión |
| Generar diagnóstico (US3) | proyecto sin evidencia | Botón deshabilitado con motivo y enlace a la captura (FR-015) |
| Panel de revisión (US4) | diagnóstico sin generar | Pantalla con enlace a «Generar diagnóstico» |
| Entrega del Líder ya calificada | entrega en estado `calificada` | Vista de solo lectura (FR-031) |

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
