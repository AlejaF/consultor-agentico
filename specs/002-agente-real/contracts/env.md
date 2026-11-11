# Contrato: variables de entorno del servicio

Se leen del entorno o de `server/.env` (ignorado por git; el ejemplo `server/.env.example` va **sin valores**). Se validan al arrancar.

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `OPENAI_API_KEY` | Para correr | — | Clave del proveedor. Nunca se registra ni se devuelve. |
| `OPENAI_MODEL_DIAGNOSTICO` | Para diagnóstico | **ninguno** | ID del modelo del Diagnóstico. |
| `OPENAI_MODEL_ESTRATEGIA` | Para estrategia | **ninguno** | ID del modelo de la Estrategia. |
| `OPENAI_MODEL_CRITICO` | Para el Crítico (P3) | **ninguno** | ID del modelo del Crítico. |
| `OPENAI_REASONING_DIAGNOSTICO`, `…_ESTRATEGIA`, `…_CRITICO` | No | sin parámetro | Nivel de razonamiento por etapa (`none`, `low`, `medium`, `high`, `xhigh`, `max`; la validez por modelo NO VERIFICADO). |
| `MAX_ITERATIONS` | No | `10` | Tope de iteraciones del bucle. |
| `MAX_INPUT_CHARS` | No | `120000` | Tope de texto enviado al modelo por corrida. |
| `MAX_OUTPUT_TOKENS` | No | por fijar en el lote C | Tope de salida por llamada. |
| `MAX_XLSX_ROWS` | No | `2000` | Filas por hoja. |
| `PORT` | No | `8787` | Puerto en `127.0.0.1`. |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | CORS. |
| `MODEL_PROVIDER` | No | `openai` | `fake` solo para pruebas; se anuncia en `/api/health`. |

**Regla IX**: no hay modelo por defecto aprobado. Si falta el de una etapa, la corrida se rechaza con `no_model_configured` y un mensaje que dice qué variable falta. Cambiar un valor sugerido de `docs/decisiones.md` requiere decisión registrada de la persona responsable.
