# Revisión manual de accesibilidad (teclado y lector de pantalla)

> **NO VERIFICADO si no se ha hecho.** Este archivo es una lista de comprobación para una persona. Ninguna casilla está marcada y ningún resultado está registrado: hasta que alguien la complete, la accesibilidad manual de la demo **no está verificada**. Las pruebas automáticas (axe, Playwright) cubren solo una parte de WCAG 2.2 AA (ver `README.md` de esta carpeta).

Referencias: FR-038 y FR-040; SC-009; principio III de la constitución.

**Cómo usarla**: abrir la demo (`npm run preview` o la dirección publicada), recorrer cada punto y completar «Hecho por / fecha / resultado» (OK, falla o no aplica, con una nota breve). Si algo falla, anotarlo en `docs/decisiones.md` (lista de pulido) y, si cambia el comportamiento, corregirlo primero en el spec.

Recorridos mínimos: P1 (Consultor: ingresar, cargar evidencia, generar, revisar y emitir) y P2 (Consultor: generar y enviar la estrategia; Líder: calificar).

## A. Solo teclado

Anchos sugeridos: 1280 px y 320 px (en celular, la barra de pestañas bajo la cabecera).

| # | Comprobación | Hecho por | Fecha | Resultado |
|---|---|---|---|---|
| A1 | El primer Tab de cada pantalla llega a «Saltar al contenido» y Enter lleva al contenido principal. | | | |
| A2 | El orden de foco sigue el orden visual y lógico (cabecera, navegación, contenido) en todas las pantallas. | | | |
| A3 | El foco es siempre visible (contorno claro) en enlaces, botones, selectores, casillas y opciones. | | | |
| A4 | No hay trampas de teclado: se puede salir de cualquier control con Tab o Mayús+Tab. | | | |
| A5 | Ingreso: cada cuenta es una sola tarjeta; se elige con Tab y Enter o Espacio, y se lee como «Entrar como … : nombre de la cuenta». | | | |
| A6 | Cambiar de rol con el selector «Rol activo» usando solo el teclado. | | | |
| A7 | Barra de pestañas (bajo 1024 px) y barra lateral: llegar a cada elemento, activar con Enter; el foco pasa al título de la nueva pantalla. | | | |
| A8 | Cabecera: «Inicio» y la marca (llevan al ingreso sin borrar el progreso), selector «Rol activo» y «Restablecer demo» (a 320 px dice «Restablecer») se alcanzan con Tab y se activan con Enter o Espacio. | | | |
| A9 | Carga de evidencia: «Elegir archivos» se activa con teclado; «Quitar» pide confirmación. | | | |
| A10 | Diálogos de confirmación («¿Quitar este archivo?», «¿Aprobar y emitir el diagnóstico?», «¿Restablecer la demo?», edición sin guardar): el foco entra al diálogo, Escape cancela y el foco vuelve al control que lo abrió. | | | |
| A11 | Revisión: Aceptar, Editar (textarea y «Guardar edición»/«Cancelar edición») y Rechazar con teclado; abrir y cerrar una cita. | | | |
| A12 | Botones con explicación de bloqueo («Generar diagnóstico», «Aprobar y emitir», «Guardar calificación»): al activarlos bloqueados no ocurre nada y la explicación es alcanzable. | | | |
| A13 | Rúbrica: cada criterio es un grupo de opciones; las flechas cambian el nivel de 1 a 5; Tab pasa al siguiente criterio; se puede escribir el comentario y guardar. | | | |
| A14 | Tablero del Líder: abrir una entrega desde la cola con teclado; la tabla (o las tarjetas bajo 640 px) se recorre en orden lógico. | | | |
| A15 | Ninguna acción exige ratón, arrastrar ni gestos (incluida la carga de archivos). | | | |

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
| Teclado (A1 a A15) | **NO VERIFICADO** (sin completar) |
| Lector de pantalla (B1 a B12) | **NO VERIFICADO** (sin completar) |

Quien complete la revisión actualiza esta tabla, `docs/evidencia/sc-checklist.md` (SC-009) y el README.
