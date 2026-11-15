# Mutaciones H4b (cada una debe hacer fallar una prueba; luego se restaura el archivo)
## M1: mostrar la traza (TraceView) en el Resumen de Estrategia
```
    Error: el Resumen de Estrategia no debe traer «trace-view»
  1 failed
```
restaurado M1
## M2: dibujar «3 de 5» en un pilar sin evidencia (Resumen de Diagnóstico)
```
    Error: hay pilares sin evidencia en el escenario de prueba
  1 failed
```
restaurado M2
## M3: una pista de barra de longitud distinta en el Tablero
```
    Error: pistas de igual longitud a 320: 38, 78, 78, 78, 78, 78
  1 failed
```
restaurado M3
## M2 (refinada): «3 de 5» en UN solo pilar sin evidencia (Cultura), con la prueba nueva «un pilar sin evidencia no dibuja ningún número»
```
    Error: ningún número de nivel en un pilar sin evidencia
  1 failed
```
restaurado M2 (refinada)
