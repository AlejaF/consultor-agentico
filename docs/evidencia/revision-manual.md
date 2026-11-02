# Revisión manual de accesibilidad (teclado y lector de pantalla)

> Este archivo es una lista de comprobación. La revisión manual de **teclado** se hizo el 2026-11-02 (ver más abajo); la revisión con **lector de pantalla NO se hizo** y sigue **NO VERIFICADO**. Las pruebas automáticas (axe, Playwright) cubren solo una parte de WCAG 2.2 AA (ver `README.md` de esta carpeta).

Referencias: FR-038 y FR-040; SC-009; principio III de la constitución.

**Cómo usarla**: abrir la demo (`npm run preview` o la dirección publicada), recorrer cada punto y completar «Hecho por / fecha / resultado» (OK, falla o no aplica, con una nota breve). Si algo falla, anotarlo en `docs/decisiones.md` (lista de pulido) y, si cambia el comportamiento, corregirlo primero en el spec.

Recorridos mínimos: P1 (Consultor: ingresar, cargar evidencia, generar, revisar y emitir) y P2 (Consultor: generar y enviar la estrategia; Líder: calificar).

## A. Solo teclado

Anchos sugeridos: 1280 px y 320 px (en celular, la barra de pestañas bajo la cabecera).

Revisión hecha por la persona responsable el 2026-11-02 en Chrome para Windows.

| # | Comprobación | Hecho por | Fecha | Resultado |
|---|---|---|---|---|
| A1 | El primer Tab de cada pantalla llega a «Saltar al contenido» y Enter lleva al contenido principal. | Persona responsable | 2026-11-02 | OK |
| A2 | El orden de foco sigue el orden visual y lógico (cabecera, navegación, contenido) en todas las pantallas. | Persona responsable | 2026-11-02 | OK |
| A3 | El foco es siempre visible (contorno claro) en enlaces, botones, selectores, casillas y opciones. | Persona responsable | 2026-11-02 | **Falla** solo en el diálogo de «Restablecer demo» (opciones «Cancelar» y «Sí, restablecer»): no se veía el foco. Corregido en la pieza L (L6g); el resto del punto, OK |
| A4 | No hay trampas de teclado: se puede salir de cualquier control con Tab o Mayús+Tab. | Persona responsable | 2026-11-02 | OK |
| A5 | Ingreso: cada cuenta es una sola tarjeta; se elige con Tab y Enter o Espacio, y se lee como «Entrar como … : nombre de la cuenta». | Persona responsable | 2026-11-02 | OK |
| A6 | Cambiar de rol con el selector «Rol activo» usando solo el teclado. | Persona responsable | 2026-11-02 | OK |
| A7 | Barra de pestañas (bajo 1024 px) y barra lateral: llegar a cada elemento, activar con Enter; el foco pasa al título de la nueva pantalla. | Persona responsable | 2026-11-02 | OK |
| A8 | Cabecera: «Inicio» y la marca (llevan al ingreso sin borrar el progreso), selector «Rol activo» y «Restablecer demo» (a 320 px dice «Restablecer») se alcanzan con Tab y se activan con Enter o Espacio. | Persona responsable | 2026-11-02 | OK |
| A9 | Carga de evidencia: «Elegir archivos» se activa con teclado; «Quitar» pide confirmación. | Persona responsable | 2026-11-02 | OK |
| A10 | Diálogos de confirmación («¿Quitar este archivo?», «¿Aprobar y emitir el diagnóstico?», «¿Restablecer la demo?», edición sin guardar): el foco entra al diálogo, Escape cancela y el foco vuelve al control que lo abrió. | Persona responsable | 2026-11-02 | OK |
| A11 | Revisión: Aceptar, Editar (textarea y «Guardar edición»/«Cancelar edición») y Rechazar con teclado; abrir y cerrar una cita. | Persona responsable | 2026-11-02 | OK |
| A12 | Botones con explicación de bloqueo («Generar diagnóstico», «Aprobar y emitir», «Guardar calificación»): al activarlos bloqueados no ocurre nada y la explicación es alcanzable. | Persona responsable | 2026-11-02 | OK |
| A13 | Rúbrica: cada criterio es un grupo de opciones; las flechas cambian el nivel de 1 a 5; Tab pasa al siguiente criterio; se puede escribir el comentario y guardar. | Persona responsable | 2026-11-02 | OK |
| A14 | Tablero del Líder: abrir una entrega desde la cola con teclado; la tabla (o las tarjetas bajo 640 px) se recorre en orden lógico. | Persona responsable | 2026-11-02 | OK |
| A15 | Ninguna acción exige ratón, arrastrar ni gestos (incluida la carga de archivos). | Persona responsable | 2026-11-02 | OK |

## B. Lector de pantalla

Probar al menos con un lector (anotar cuál y su versión en «Resultado»). Navegador sugerido: el que use la persona normalmente.

| # | Comprobación | Hecho por | Fecha | Resultado |
|---|---|---|---|---|
| B1 | Al cambiar de pantalla se anuncia el título de la nueva pantalla y el foco queda en el encabezado principal. | | | |
| B2 | El aviso «DEMO · datos ficticios» y el rótulo «Simulada» se anuncian donde corresponde. | | | |
| B3 | Los estados de la navegación (Pendiente, En curso, Completado, Bloqueado, Disponible) se leen como texto, no solo por color. | | | |
| B4 | Los avisos (redirección «No encontramos esa pantalla.», restablecimiento, almacenamiento no disponible) se anuncian y se pueden cerrar. | | | |
| B5 | Los errores de la carga de archivos (formato, tamaño, duplicado) se anuncian con el motivo. | | | |
| B6 | El resultado de cada decisión de revisión («Hallazgo …: aceptado/rechazado/editado») y «Diagnóstico emitido» se anuncian. | | | |
| B7 | Los botones de cada hallazgo se distinguen por su nombre completo (p. ej. «Aceptar hallazgo: …»), no solo «Aceptar». | | | |
| B8 | Las citas se anuncian como botones expandibles y el extracto abierto lleva su rótulo «Evidencia de ejemplo (ficticia)». | | | |
| B9 | La rúbrica se anuncia como grupo con el nombre del criterio, su descripción y el nivel elegido; el motivo por el que «Guardar calificación» está impedido se lee. | | | |
| B10 | Las barras de progreso tienen nombre y valor; las tablas anuncian encabezados de fila y de columna (también bajo 640 px). | | | |
| B11 | La vista «Empresa» anuncia su mensaje y no ofrece enlaces ni menús vacíos. | | | |
| B12 | Ningún control queda sin nombre accesible (iconos, botones de cierre, selector de rol). | | | |

## Resultado global

| Ámbito | Estado |
|---|---|
| Teclado (A1 a A15) | Revisado el 2026-11-02 en Chrome para Windows: todos los puntos pasaron salvo el foco visible en el diálogo de «Restablecer demo», corregido en la pieza L (L6g) |
| Lector de pantalla (B1 a B12) | **NO VERIFICADO**: la revisión no se hizo |

Quien complete la revisión actualiza esta tabla, `docs/evidencia/sc-checklist.md` (SC-009) y el README.
