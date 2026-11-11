# Lista de calidad de la especificación: Agente real con IA

**Propósito**: validar que la especificación está completa antes de planificar
**Creada**: 2026-11-11
**Función**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, marcos, API). Solo se nombra al proveedor (OpenAI), exigido por la constitución y el aviso de privacidad.
- [x] Centrada en valor para la persona y en el negocio
- [x] Escrita para personas no técnicas
- [x] Todas las secciones obligatorias completas

## Completitud de requisitos

- [x] Sin marcadores [NEEDS CLARIFICATION]
- [x] Requisitos comprobables y sin ambigüedad
- [x] Criterios de éxito medibles (SC-A6 es una meta NO VERIFICADO, declarada como tal)
- [x] Criterios de éxito sin tecnología
- [x] Escenarios de aceptación definidos
- [x] Casos límite identificados
- [x] Alcance claramente acotado
- [x] Dependencias y supuestos identificados

## Preparación de la función

- [x] Todos los requisitos tienen criterio de aceptación claro
- [x] Los escenarios cubren los flujos principales
- [x] La función cumple los resultados medibles
- [x] Sin fugas de implementación en la especificación

## Notas

- Ajuste 2026-11-11 (2): el texto completo puede vivir en la memoria del servicio local mientras corra (AG-025, AG-026); nuevo AG-030 (reabrir archivos tras recargar), SC-A7, aviso AG-004 ampliado y caso límite de servicio reiniciado; sustituye al caso «volver a cargar tras recargar». Todos los puntos siguen cumplidos.

- Ajuste 2026-11-11: AG-025 ampliado (traza resumida, información faltante y objeciones se conservan), nuevo AG-029 (modo fijado por proyecto), caso límite de recarga y AG-013 como regla verificable de instrucciones en documentos. Sin historias nuevas ni cambios de prioridad; todos los puntos siguen cumplidos.

- AG-005 modifica FR-011 y SC-003 solo para el modo «IA real»; hay que reflejarlo al planificar.
- Pendiente de la constitución 2.0.0: reflejarla también en spec, plan y tareas de la 001 donde corresponda.
