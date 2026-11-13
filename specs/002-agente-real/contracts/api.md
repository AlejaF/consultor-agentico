# Contrato: servicio local (`server/`)

**Base**: `http://127.0.0.1:8787` (puerto configurable). En desarrollo, el navegador llama a `/api/…` y Vite lo reenvía. Solo se aceptan los orígenes y `Host` permitidos. Todas las respuestas son JSON. **Sin streaming.** Los errores siguen un formato único.

## Formato de error

```json
{ "error": { "category": "spend_limit | balance | rate_limit | auth | usage_limit | invalid_request | model_unavailable | access_denied | provider_unavailable | no_model_configured | input_too_large | bad_request | extraction_failed | internal",
             "message": "Texto claro en español", "retryable": false, "retryAfterSeconds": 12,
             "providerStatus": 404, "providerCode": "model_not_found" } }
```
`providerStatus` y `providerCode` (el estado HTTP y el `error.code` reales del proveedor) aparecen solo si existen. El mensaje nunca incluye la clave: se tacha la exacta y todo lo que tenga forma de clave, y se acota a 300 caracteres.

**Cómo se clasifican los errores del proveedor** (de arriba abajo; la primera regla que aplica gana):

| Condición del proveedor | `category` | HTTP del servicio |
|---|---|---|
| código de gasto (`*_spend_limit_exceeded`) | `spend_limit` | 402 |
| saldo agotado (`credit_balance_exhausted`, `insufficient_quota`) | `balance` | 402 |
| `organization_usage_limit_exceeded` | `usage_limit` | 429 |
| 429 o `rate_limit_exceeded` | `rate_limit` | 429 |
| 401, `invalid_api_key`, o 403 sin código | `auth` | 401 |
| 404 o código `model_not_found` (modelo inexistente o no permitido en el proyecto) | `model_unavailable` | 502 |
| otro 403 con código (país no admitido, permisos…) | `access_denied` | 502 |
| otro 4xx (400, 413, 422…) salvo 408 y 409 | `invalid_request` | 502 |
| 5xx, 408, 409, red | `provider_unavailable` | 502 |

`retryable` es solo informativo: **el servicio nunca reintenta por su cuenta** ante `spend_limit`, `balance`, `auth` ni `usage_limit` (AG-011), y tampoco ante `invalid_request`, `model_unavailable` ni `access_denied` (reintentar no los arregla).

## `GET /api/health`

```json
{ "ok": true, "version": "0.1.0", "keyConfigured": true,
  "models": { "diagnosis": "…", "strategy": "…", "critic": null },
  "limits": { "maxIterations": 10, "maxInputChars": 120000, "maxFileBytes": 26214400 },
  "fake": false }
```
Nunca devuelve la clave ni parte de ella. `models.*` es el valor de la variable o `null` si falta. `fake: true` solo en el arranque de pruebas.

## `POST /api/evidence?projectId=P-A` (multipart, 1 a N archivos)

Valida (mismos criterios que la 001, FR-010): formato, 25 MB, nombre ≤ 150 caracteres. Extrae el texto **en memoria**.

```json
{ "files": [
  { "id": "f1", "name": "politica.pdf", "type": "application/pdf", "size": 120331, "status": "extracted", "chars": 18200, "chunkCount": 12 },
  { "id": "f2", "name": "escaneo.pdf", "status": "failed", "reason": "pdf_sin_texto", "message": "Este PDF no tiene texto seleccionable (parece escaneado). Esta versión no usa OCR." }
] }
```

Si un archivo falla, los demás se procesan. Parcial por tope de filas: `status: "extracted"` con `warning: "tope_filas_alcanzado"`.

**Motivos de fallo (`reason`) y avisos (`warning`) construidos en el lote B** (cada fallo trae su `message` en español, sin texto del documento):

| `reason` | Cuándo |
|---|---|
| `formato_no_permitido`, `vacio`, `demasiado_grande`, `nombre_largo` | Las mismas reglas y mensajes que FR-010 de la 001 (se validan en el servicio; no se guardan) |
| `pdf_sin_texto` | PDF sin texto seleccionable (escaneado): «Este PDF no tiene texto seleccionable (parece escaneado). Esta versión no usa OCR.» |
| `cifrado` | PDF con contraseña, o DOCX/XLSX protegidos (contenedor OLE) |
| `danado` | El archivo no se puede abrir o no es del tipo que indica su extensión |
| `sin_texto` | El archivo se abrió pero no tiene texto (DOCX, XLSX, TXT, VTT o SRT) |
| `tiempo_agotado` | La lectura tardó más del máximo por archivo (20 s por defecto) |

Avisos de extracción parcial (`status: "extracted"` con `warning`): `tope_filas_alcanzado` (más de `MAX_XLSX_ROWS` filas con contenido en una hoja) y `tope_paginas_alcanzado` (PDF con más de 200 páginas; solo se usan las primeras 200). Los archivos con fallo de extracción **sí** quedan en `GET /api/evidence/:projectId` (con su motivo); los rechazados por validación (formato, nombre, tamaño) solo figuran en la respuesta del `POST`.

## `GET /api/evidence/:projectId`

Lista lo que el servicio tiene en memoria para ese proyecto (AG-030). Si el servicio se reinició, `{ "files": [] }`.

## `DELETE /api/evidence/:projectId/:fileId`

Quita el archivo de la memoria. Responde `{ "ok": true }`.

## `POST /api/diagnosis/run`

```json
{ "projectId": "P-A", "empresa": "Empresa Ficticia Alfa" }
```
Usa solo los archivos `extracted` del proyecto. Responde cuando termina:

```json
{ "run": { "stage": "diagnosis", "model": "…", "reasoning": "low", "iterations": 7, "partial": false,
           "tokens": { "input": 41200, "output": 3100, "total": 44300 } },
  "findings": [ { "id": "R1", "dimension": "datos", "title": "…", "text": "…", "verified": true,
                  "citations": [ { "file": "politica.pdf", "location": { "kind": "page", "page": 3 }, "quote": "…", "verified": true } ] } ],
  "missingInfo": [ { "dimension": "talento", "description": "…" } ],
  "trace": [ { "type": "tool", "name": "buscar_en_evidencia", "args": { "consulta": "…" }, "resultSummary": "5 fragmentos", "ok": true } ],
  "warnings": [ ] }
```
`partial: true` + `warnings` cuando se alcanzó un tope (AG-008). Errores del proveedor terminan la corrida con el formato de error **e incluyen** la traza hasta ese punto en `error.trace` para no perderla.

## `POST /api/strategy/run`

```json
{ "projectId": "P-A", "empresa": "…",
  "findings": [ { "id": "R1", "dimension": "datos", "title": "…", "text": "…", "state": "accepted | edited", "quotes": [ { "file": "…", "location": {…}, "quote": "…" } ] } ] }
```
El cliente envía **solo** hallazgos aceptados o editados y verificados, con su texto vigente (el editado, si lo hubo) y sus extractos. El servicio **no** conserva hallazgos; vuelve a comprobar que `findings` no esté vacío y que cada id sea único. Respuesta: `run`, `risks`, `route` (cada elemento con `supportedBy`), `trace`, `warnings`.

## `POST /api/critic/run` (P3)

Cuerpo: igual a diagnóstico con `findings` generados. Respuesta: `run`, `objections[]`, `trace`.

## Códigos HTTP

`200` éxito; `400` cuerpo inválido; `413` archivo o entrada demasiado grande; `422` extracción imposible de todos los archivos; `402`/`429`/`401`/`502` según la categoría del proveedor (el cuerpo siempre trae la categoría interna); `500` interno. **El navegador decide por `error.category`, no por el código HTTP.**

## Reglas transversales

- `projectId` válido: coincide con `^[A-Za-z0-9-]{1,32}$`.
- Una sola corrida por proyecto a la vez; una segunda solicitud responde `409`.
- Si el cliente cierra la conexión, se aborta la corrida y se descarta el resultado.
- Nada se escribe a disco; el registro nunca incluye cuerpos de documentos ni claves.
