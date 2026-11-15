# Mutaciones H5 (cada una debe hacer fallar una prueba; luego se restaura)
## M4: «Ver trazabilidad» apunta al mismo ancla que «Ver riesgos y ruta»
```
    Error: foco en trazabilidad-titulo
  1 failed
```
restaurado
## M6: quitar el aviso de resultado parcial y errores del Resumen de Diagnóstico
```
    Error: expect(locator).toBeVisible() failed
    Error: element(s) not found
  1 failed
```
restaurado
## M2-H5: sin el CSS del grupo de pilar (contenedor enmarcado), la prueba de grupos falla
```
Error: diagnostico: «Pilar: Infraestructura» tiene marco sutil (recibido false)
```
(Se comprobó quitando las reglas «H5 · punto 2» de src/styles/h4.css y restaurándolas.)
