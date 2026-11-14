# Guía de validación (quickstart): Agente real con IA

**Plan**: [plan.md](./plan.md) | Los comandos de `server/` existirán cuando se implemente el lote A; hoy es la guía de lo que se validará.

## Requisitos previos

- Node `>=24` (local: v26.13.0 verificado) y las dependencias de la raíz instaladas (`npm ci`).
- Para el servicio: `npm ci --prefix server`.
- Para la prueba real: una clave propia de OpenAI y los **modelos que la persona responsable decida** (ver research.md §3). **No** se necesita clave para las pruebas automáticas.

## 1. Modo Simulado intacto (SC-A5)

```bash
npm run typecheck && npm test && npm run check && npm run test:e2e
```
Esperado: todo pasa **sin haber modificado ninguna prueba de la 001**.

## 2. Seguridad (SC-A2, principio IX)

```bash
npm run check          # incluye check-secrets sobre el repositorio y dist/
npm run build && npm run check
```
Prueba negativa: colocar una clave falsa en un archivo versionado y en `dist/` y comprobar que `check` **falla**; quitarla. Confirmar que `server/.env.example` no está ignorado y `server/.env` sí (`git check-ignore -v`).

## 3. Servicio con cliente falso (sin gasto)

```bash
MODEL_PROVIDER=fake npm run dev:server     # http://127.0.0.1:8787
curl -s http://127.0.0.1:8787/api/health   # fake: true, keyConfigured según el entorno
```
Esperado: responde solo en `127.0.0.1`; desde otra interfaz no.

## 4. Pruebas del servicio (sin gasto)

```bash
npm test                                   # incluye tests/server con el cliente FALSO
```
Cubren: bucle y topes, argumentos mal formados, reintentos del verificador (máx. 2), gasto/saldo sin reintento, verificador con mayúsculas/tildes/espacios (SC-A1), extracción de los 6 formatos y motivos de fallo, estrategia sin respaldo (SC-A4).

## 5. Recorrido de IA real con servicio en modo falso (e2e)

```bash
npm run test:e2e:real -- tests/e2e/ia-real.spec.ts
```
Valida: selector Simulado / IA real; «IA real» no disponible si no hay servicio; aviso previo con OpenAI y memoria; carga de los 6 formatos con estado de extracción; ejecutar → hallazgos con «Extracto de tu archivo» y rótulo de IA; `TraceView` con modelo y tokens (SC-A3); revisión → emisión → calificación → informe; recarga con servicio vivo y volver a ejecutar sin recargar archivos (SC-A7); servicio reiniciado → aviso de qué archivos volver a cargar.

## 6. Prueba de humo con el modelo real (manual, con costo)

1. Crear `server/.env` con la clave y los modelos elegidos (propuesta de desarrollo en research.md §3).
2. `npm run dev:all`, elegir «IA real», cargar los fixtures ficticios de `tests/fixtures/`.
3. Ejecutar el diagnóstico y anotar: modelo, tokens, número de hallazgos, citas verificadas y fallidas, tiempo total (**SC-A6: se mide, no se asume**), error alguno.
4. Guardar un resumen en `docs/evidencia/` **sin clave ni texto de documentos reales**.

## 7. Casos límite manuales

- Quitar la clave → mensaje claro, sin ejecución.
- Provocar un límite de gasto en una cuenta de pruebas (si es posible; **NO VERIFICADO** que se pueda) → mensaje claro y **cero reintentos** (comprobar en la traza).
- Cerrar la pestaña durante una corrida y volver: sin resultado a medias.
- Reiniciar el servicio con hallazgos ya emitidos → hallazgos visibles y aviso de archivos por recargar.

## Criterios de salida

SC-A1 a SC-A5 y SC-A7 verificados con evidencia; SC-A6 medido o declarado **NO VERIFICADO**.
