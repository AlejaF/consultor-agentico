# Contrato de diseño: tokens

Todos los tokens viven en `src/styles/tokens.css` como variables CSS en `:root`. Ningún otro archivo de `src/` puede contener colores literales (`scripts/check-tokens.mjs` lo comprueba). Cambiar la paleta o la tipografía es editar solo ese archivo (constitución V).

Contraste calculado con la fórmula de luminancia relativa de WCAG 2.x. «Texto» exige 4,5:1; «gráfico/componente» exige 3:1. Origen: **Est.** = interfaz de estudiantes, **Prof.** = interfaz de profesorado, **Ajustado** = ajustado para cumplir AA (ver [research.md](../research.md) §4), **Derivado** = propio del proyecto, no tomado de las referencias.

## Color

| Token | Valor | Uso | Origen | Contraste (par) |
|---|---|---|---|---|
| `--color-bg` | `#f7f6fb` | fondo de página | Est. | — |
| `--color-surface` | `#ffffff` | tarjetas, paneles, entradas | Est./Prof. | — |
| `--color-surface-muted` | `#f0f0f0` | encabezados de tabla, bloques de cita | Prof. | — |
| `--color-ink` | `#0d0b19` | títulos | Est. | 19,46:1 sobre `--color-surface`; 18,10:1 sobre `--color-bg` |
| `--color-text` | `#2a2a2a` | texto de cuerpo | Prof. | 14,35:1 sobre superficie; 13,35:1 sobre `--color-bg` |
| `--color-text-muted` | `#5a5365` | texto secundario | Est. | 7,34:1 sobre superficie; 6,83:1 sobre `--color-bg`; 6,34:1 sobre `--color-primary-soft` |
| `--color-placeholder` | `#666666` | texto de ayuda en entradas | Est./Prof. | 5,74:1 sobre superficie |
| `--color-primary` | `#5046e5` | botones, enlaces, barra de navegación, relleno de barras | Est. | blanco sobre primario 6,27:1; primario sobre superficie 6,27:1; sobre `--color-bg` 5,83:1 |
| `--color-on-primary` | `#ffffff` | texto sobre primario | — | 6,27:1 |
| `--color-primary-strong` | `#4338ca` | estado «presionado/hover» | Derivado | blanco sobre él 7,90:1 |
| `--color-primary-soft` | `#eeedfb` | fondo del elemento activo | Est. | primario sobre él 5,42:1 |
| `--color-border` | `#88898b` | borde de entradas y controles | Prof. | 3,50:1 sobre superficie; 3,26:1 sobre `--color-bg`; 3,07:1 sobre `--color-surface-muted` |
| `--color-border-subtle` | `#e4e2ed` | borde de tarjetas (decorativo) | Est. | 1,28:1 (no indica estado ni es único indicador de un control) |
| `--color-track` | `#efedf8` | pista de barras de progreso | Est. | primario sobre pista 5,42:1 |
| `--color-bar-low` | `#d04a20` | barra de pilar bajo | Ajustado (Prof. `#e8683b`) | 3,87:1 sobre pista (antes 2,85:1) |
| `--color-warn-text` / `--color-warn-bg` | `#a34700` / `#fdf3e7` | «En curso», riesgo medio | Ajustado (Est. `#bf5500`) | 5,54:1 (antes 4,24:1); 6,07:1 sobre blanco |
| `--color-ok-text` / `--color-ok-bg` | `#06702d` / `#e8f5ec` | «Completado», aceptar, trazabilidad | Ajustado (Est. `#0e8c45`, `#078134`, `#17ab4b`) | 5,56:1 (antes 3,85 y 4,45); 5,81:1 sobre `--color-bg` (antes 2,80:1) |
| `--color-danger-text` / `--color-danger-bg` | `#c11217` / `#fce8e7` | rechazar, riesgo alto | Est. | 5,30:1; 6,24:1 sobre blanco |
| `--color-pending-text` / `--color-pending-bg` | `#5c5867` / `#f2f0fb` | «Pendiente», «Procesando» | Est. | 6,12:1 |
| `--color-chip-yellow` | `#e4eb61` | etiqueta «Contradicción», «En revisión» | Prof. | tinta sobre ella 15,16:1 |
| `--color-chip-green` | `#4cb978` | etiqueta «Fortaleza» | Prof. | tinta sobre ella 7,89:1 |
| `--color-chip-orange` | `#e8683b` | etiqueta «Brecha» | Prof. | **tinta** sobre ella 6,00:1 (el blanco daba 3,24:1: no usar blanco) |
| `--color-focus` | `#0d0b19` | anillo de foco sobre superficies claras | Derivado | 19,46:1 sobre superficie |
| `--color-focus-on-primary` | `#ffffff` | anillo de foco sobre la barra de navegación | Derivado | 6,27:1 sobre primario |

Reglas de uso:
- Los estados se muestran siempre con **texto y color** (una etiqueta «Completado», no solo un punto verde).
- El anillo de foco es de 3 px con 2 px de separación; sobre fondo primario se usa `--color-focus-on-primary`.
- Los rótulos «Simulada» y «NO VERIFICADO» usan texto en negrita con borde visible, legibles en blanco y negro (FR-047).

## Tipografía

| Token | Valor | Nota |
|---|---|---|
| `--font-sans` | `"Plus Jakarta Sans Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Origen: parecida a las referencias a ojo, **NO VERIFICADO**; licencia OFL-1.1 verificada. Se cambia solo aquí |
| `--font-size-base` | `1rem` (16 px) | cuerpo |
| `--font-size-sm` | `0.875rem` | notas y etiquetas |
| `--font-size-lg` | `1.125rem` | texto destacado |
| `--font-size-h2` / `--font-size-h1` | `1.5rem` / `2rem` (la escala fluida no baja de estos valores en 320 px: `clamp(1.5rem, 4vw, 2rem)` en h1) | títulos |
| `--line-height` | `1.5` | cuerpo |
| `--weight-regular` / `--weight-bold` | `400` / `700` | — |

## Espaciado, forma y objetivos táctiles

| Token | Valor |
|---|---|
| `--space-1…6` | `0.25rem, 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem` |
| `--radius` | `10px` (tarjetas), `--radius-sm`: `6px` (controles) |
| `--target-min` | `44px` (alto y ancho mínimos de todo control interactivo; FR-039) |
| `--gutter` | `16px` (margen lateral en celular) |
| `--bp-sm`, `--bp-md` | `640px`, `1024px` (punto de corte de tablas/panel y de navegación lateral) |

## Verificación

- `check-tokens`: falla si aparece un color hexadecimal, `rgb(` o `hsl(` fuera de `tokens.css`.
- Prueba automática del contraste: una prueba de Vitest lee los pares de la tabla anterior y comprueba los umbrales (4,5:1 texto; 3:1 gráfico) para que un cambio de token no rompa AA sin avisar.
