# H4a: las pruebas nuevas se vieron fallar antes de implementar

- `tests/unit/vista.test.ts`: fallaba entero con «Cannot find module '../../src/app/vista'» (no existían ni la vista inicial ni las subrutas).
- `tests/e2e/ia-real-h4-resumen.spec.ts` (con `playwright.h4.config.ts`, proyecto 1280): **8 de 8 fallaban** (no existía el Resumen: «element(s) not found» / `toBeVisible` fallido), antes de escribir cualquier código de la vista.
- Después de implementar: 7 unitarias y 27 e2e (8 pruebas × 320/768/1280, 3 de ellas con las cuatro anchuras dentro de la prueba) pasan.
