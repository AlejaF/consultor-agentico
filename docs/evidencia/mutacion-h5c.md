# Mutaciones H5c (cada una debe hacer fallar una prueba; luego se restaura el archivo)
## M1: escribir un número fijo («3») en la cifra «Entregas por revisar» (dinamismo a)
```
    Error: Entregas por revisar baja en 1
    Expected: 2
    Received: 3
  1 failed
  4 passed (59.4s)
```
## M2: escribir a mano el texto de «Proyectos por etapa» (dinamismo b)
```
    Error: el gráfico cuenta un proyecto más
    Expected: 8
    Received: 7
  1 failed
  4 passed (43.4s)
```
## M3: volver a poner el control Resumen | Detalle en el Tablero
```
    Error: expect(locator).toHaveCount(expected) failed
    Expected: 0
    Received: 1
  1 failed
```
## M4: volver a poner la cola de revisión en el Tablero
```
    Error: expect(locator).toHaveCount(expected) failed
    Expected: 0
    Received: 1
  1 failed
```
Archivos restaurados (diff sin diferencias).
