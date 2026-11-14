# Lote D3 — comprobación por mutación de roles (T169)

Fecha: 2026-11-14. Cada mutación se aplicó sobre el archivo real, se corrieron `aiBadge`, `roleVisibility` (Vitest) y `ia-real-roles.spec.ts` (Playwright, 1280 px), y el original se restauró; `diff` confirmó que quedó idéntico.

| # | Mutación | Pruebas que fallan | Resultado |
|---|----------|--------------------|-----------|
| M1 | `canSeeTrace` devuelve verdadero para todos los roles | `roleVisibility` (1 fallo). El e2e de la Empresa **no** falla | Detectada por la prueba unitaria |
| M2 | `canSeeTechSheet` devuelve verdadero para todos | `roleVisibility` (1 fallo) y 1 prueba e2e (la Empresa recibía la ficha en su informe) | Detectada por ambas |
| M3 | `AiBadge` vuelve a mostrar el modelo | `aiBadge` (3 fallos) y 3 pruebas e2e (rótulo con modelo) | Detectada por ambas |

**Nota honesta sobre M1**: en las pantallas de la Empresa no existe ninguna ruta que dibuje la traza, así que aunque la regla de rol se rompa, hoy el e2e no puede verlo. La protección es doble: (1) la Empresa no tiene la traza en sus pantallas y (2) `TraceView` y `RunNotices` se niegan a dibujarse sin rol interno. La segunda capa la vigila la prueba unitaria; la primera la vigila el e2e de la Empresa (que revisa el DOM completo).

Archivos restaurados e idénticos al original: `src/domain/visibility.ts`, `src/components/AiBadge.tsx`.
