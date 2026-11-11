# Contrato: servicio local (`server/`)

**Base**: `http://127.0.0.1:8787` (puerto configurable). En desarrollo, el navegador llama a `/api/…` y Vite lo reenvía. Solo se aceptan los orígenes y `Host` permitidos. Todas las respuestas son JSON. **Sin streaming.** Los errores siguen un formato único.

## Formato de error

```json
{ "error": { "category": "spend_limit | balance | rate_limit | auth | usage_limit | provider_unavailable | no_model_configured | input_too_large | bad_request | extraction_failed | internal",
             "message": "Texto claro en español", "retryable": false, "retryAfterSeconds": 12 } }
```
`retryable` es solo informativo: **el servicio nunca reintenta por su cuenta** ante `spend_limit`, `balance`, `auth` ni `usage_limit` (AG-011).

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
