# H4b · fase roja (pruebas antes de implementar)

Unitarias (tests/unit/vista-h4b.test.ts): 3 fallan, 1 pasa (la de que 'entregas' no se confunde).

e2e (ia-real-h4-estrategia-tablero.spec.ts, proyecto 1280): 10 fallan, 1 pasa (pistas iguales: ya lo cumplía el Tablero actual; su mutación se prueba aparte).

```
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:67:3 › Estrategia · Resumen › por defecto abre el Resumen: 2 cifras, «Riesgos por nivel», ruta por horizonte y botones; el Detalle no está montado 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:99:3 › Estrategia · Resumen › un riesgo, una fase y los botones abren el Detalle en su tarjeta, con el foco en su encabezado 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:120:3 › Estrategia · Resumen › el control Resumen | Detalle se maneja con teclado y la vista sobrevive a recargar; el Detalle conserva la pantalla actual 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:139:3 › Estrategia · Resumen › con IA real: nada técnico en el Resumen (ni traza, ni modelo, ni tokens), el rótulo de IA y «IA real»; la Empresa no ve nada técnico 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:170:3 › Tablero · Resumen › por defecto abre el Resumen: 4 cifras con su contexto, tabla de 4 columnas, cola de 3, un gráfico con una leyenda y un botón al Detalle 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:222:3 › Tablero · Resumen › «Ver detalle del tablero» abre el Detalle, que conserva todo lo de antes; la vista sobrevive a recargar 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:241:3 › Diagnóstico · Resumen · pulidos › modo visible, tarjeta única «Estado de los hallazgos» con leyenda, pilares con «›» y sin marca oscura 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:269:3 › Diagnóstico · Resumen · pulidos › a 480 px o menos cada fila de pilar apila el nombre, la barra y los chips; a 1280 el nombre queda a la izquierda 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:294:3 › Diagnóstico · Resumen · pulidos › un proyecto Simulado dice que ese modo no tiene niveles por pilar, sin bloques vacíos y con sus rótulos 
[1280] › tests/e2e/ia-real-h4-estrategia-tablero.spec.ts:310:1 › accesibilidad AA, teclado, objetivos de 44 px y sin desplazamiento horizontal a 320, 768, 1280 y 1920; altura y bloques de cada Resumen 
```
