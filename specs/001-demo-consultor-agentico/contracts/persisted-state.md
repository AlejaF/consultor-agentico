# Contrato del estado persistido

Esquema, versionado y migración del estado que la demo guarda en el navegador. Los tipos están en [data-model.md](../data-model.md) §3; este documento fija **cómo se guarda y se carga**.

## Almacenamiento

| Elemento | Valor |
|---|---|
| Mecanismo | almacenamiento local del navegador (clave–valor, solo texto) |
| Clave | `consultor-agentico-demo:state` |
| Formato | un único JSON con `schemaVersion` en la raíz |
| Escritura | tras cada acción del reducer, con un retraso de 200 ms (agrupa ráfagas), **y de inmediato (flush) en los eventos `pagehide` y `visibilitychange`** (este último solo cuando la página pasa a oculta) |
| Lectura | una vez, al iniciar la aplicación |
| Acceso | a través de una interfaz mínima inyectable: `getItem(key)`, `setItem(key, value)`, `removeItem(key)` |
| Contenido prohibido | contenido de archivos, extractos, texto de hallazgos preparados, estrategia derivada |

## Guardado inmediato (flush)

- `persistence.flush()` cancela el temporizador pendiente y, si hay cambios sin escribir, los escribe en el acto. Es idempotente: sin cambios pendientes no escribe; en modo memoria no hace nada.
- `attachFlush(target, flush, getVisibility)` registra `pagehide` y `visibilitychange` (este solo ejecuta el flush si la visibilidad es `hidden`) y devuelve la función para quitar los oyentes. Recibe el objetivo de eventos y la lectura de visibilidad por inyección, para probarlo sin navegador.
- Motivo: sin flush, una recarga o cierre dentro de los 200 ms posteriores a la última acción perdería esa acción.
- NO VERIFICADO que todos los navegadores móviles disparen estos eventos en todos los cierres; por eso se conserva el retraso corto de 200 ms además del flush.

## Qué se guarda de los archivos propios (FR-006, FR-011, FR-012)

Solo `{ id, name, type, size, addedAt }`. El contenido **nunca** se lee, de modo que no puede guardarse ni salir del navegador. Tras recargar, cada archivo sigue listado con «Cargado localmente · no analizado» y la nota «Contenido no conservado en esta demo».

## Versión y migración

- `SCHEMA_VERSION` es una constante entera (hoy `2`; subió de 1 a 2 en L3 porque los estados iniciales sembrados cambiaron: diagnósticos emitidos y decisiones).
- **No hay migración incremental**: si `schemaVersion` de lo guardado no coincide, se **descarta todo y se usa el estado inicial** (decisión del responsable). Se muestra una sola vez el aviso «Se restableció la demo porque la versión de los datos cambió».
- Se debe subir `SCHEMA_VERSION` siempre que cambie la forma de `PersistedState` o un identificador estático al que apunte (por ejemplo, ids de proyectos u hallazgos).

## Algoritmo de carga

1. Intentar `getItem(key)`. Si lanza excepción → **modo memoria**: estado inicial + aviso permanente «No se puede guardar el progreso en este navegador» (FR-007).
2. Si no hay valor → estado inicial, sin aviso.
3. Si el texto no es JSON válido → estado inicial + aviso «Los datos guardados estaban dañados».
4. Si `schemaVersion !== SCHEMA_VERSION` → estado inicial + aviso de versión.
5. Validar la forma (tipos de los campos y que los identificadores referencien proyectos, hallazgos y criterios que existen). Si falla → estado inicial + aviso de datos dañados.
6. Si todo es válido → usar el estado guardado.

## Algoritmo de guardado

1. Serializar `PersistedState`.
2. `setItem(key, json)`. Si lanza excepción (cuota, modo privado) → pasar a modo memoria con el aviso permanente; la aplicación sigue funcionando.
3. «Restablecer demo» → `removeItem(key)` y estado inicial, tras confirmación.

## Pruebas (Vitest, con almacenamiento simulado y temporizadores simulados)

| Caso | Resultado esperado |
|---|---|
| Guardar y volver a cargar un estado con decisiones y un archivo propio | idéntico, y el archivo solo trae nombre, tipo y tamaño |
| `schemaVersion` distinta | estado inicial + aviso de versión |
| JSON inválido | estado inicial + aviso de datos dañados |
| Forma inválida (decisión sobre un hallazgo inexistente) | estado inicial + aviso de datos dañados |
| `getItem` lanza | modo memoria + aviso permanente |
| `setItem` lanza | modo memoria + aviso; el estado en memoria sigue funcionando |
| Restablecer | `removeItem` llamado y estado inicial |
| Cambio + `flush()` antes de 200 ms | se escribe de inmediato; el temporizador queda cancelado (una sola escritura) |
| `flush()` sin cambios pendientes | no escribe |
| Varias acciones dentro de 200 ms sin flush | una sola escritura al cumplirse el plazo |
| `flush()` con `setItem` que lanza | modo memoria + aviso |
| `attachFlush`: `pagehide` | llama a `flush` |
| `attachFlush`: `visibilitychange` con página oculta / visible | llama a `flush` / no llama |
| `attachFlush`: función devuelta | quita ambos oyentes |
| Nada en el almacenamiento | estado inicial sin aviso |


## Restablecer y varias pestañas (FR-006)

- «Restablecer demo» MUST: cancelar el guardado con retraso y el guardado pendiente, borrar la clave del almacenamiento y reemplazar el estado en memoria por el estado inicial completo.
- Si la misma demo está abierta en otra pestaña del mismo navegador, esa pestaña MUST escuchar el evento `storage` de la clave y **adoptar** el valor nuevo (o el estado inicial si la clave se borró), cancelando su guardado pendiente y sin reescribir el valor adoptado. Una pestaña con datos viejos nunca debe volver a escribirlos tras un restablecimiento hecho en otra.
