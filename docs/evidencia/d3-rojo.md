# Lote D3 — compuerta «ver fallar» (T164)

Fecha: 2026-11-14. Las pruebas T159–T163 se escribieron **antes** del código y se ejecutaron contra el código del lote D2.

## Pruebas unitarias (`npx vitest run` de los 4 archivos)
- `tests/unit/aiBadge.test.ts`: 3 fallos. `aiBadgeText()` devolvía «Generado por IA (modelo undefined) · requiere revisión humana» (con modelo).
- `tests/unit/roleVisibility.test.ts`: no cargaba, no existía `src/domain/visibility`.
- `tests/unit/techSheet.test.ts`: no cargaba, no existía `src/domain/techSheet`.
- `tests/unit/missingInfo.test.ts` (añadidos): 1 fallo, el título nuevo no estaba (seguía «Información que habría hecho falta»). La prueba «una sugerencia no es un hallazgo» ya pasaba (la regla de la 002 ya se cumplía; se deja como protección).

## Pruebas e2e (a 1280 px, `ia-real-roles` + `ia-real-faltante`)
- 8 fallos, 3 pasaban. Razones: no existía el texto «Ver cómo trabajó el agente», la ficha técnica, los avisos fuera de la traza ni el panel del Líder con traza; el rótulo seguía llevando el modelo («Received: Generado por IA (modelo modelo-falso-e2e) …»); la Empresa tenía `trace-view` en el DOM.
- Pasaba sin cambios: «error del proveedor al generar» (es tolerante a propósito: protege que la traza de ese intento no se despliegue sola) y las dos pruebas de `ia-real-faltante` que no dependen del texto nuevo.

## Pruebas de la 001
No se tocó ninguna.
