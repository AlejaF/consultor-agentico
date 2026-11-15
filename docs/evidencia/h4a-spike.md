# Spike de viabilidad H4a (vista inicial por variable de compilación)

Resultado: **viable, sin editar ninguna prueba**.

- **001**: `playwright.config.ts` arranca `npm run build && npm run preview` (puerto 4173). `webServer.env` pasa `VITE_VISTA_INICIAL=detalle` al `build`, que Vite incrusta en el paquete.
- **002**: `playwright.real.config.ts` arranca `npx vite` (dev, puerto 5174) más el servicio falso; `webServer.env` en el servidor de Vite fija la variable al iniciar.
- **Rutas por hash**: `matchRoute` resuelve `…/diagnostico/resumen` y `…/diagnostico/detalle[/<sección>]` como la misma ruta `consultor.diagnosis` (sin identificadores nuevos en `ROUTES`; la prueba de matriz exige que las direcciones de muestra cubran exactamente esa tabla).
- **«Restablecer demo»**: vuelve al ingreso y no guarda la vista (la vista vive en la ruta), así que no interactúa con la variable.
- **Efecto lateral a vigilar**: con `reuseExistingServer: true` en la configuración de la 001, un servidor ya abierto en 4173 (con otro paquete) se reutilizaría; hay que cerrarlo antes. Tras correr e2e, `dist/` queda con el paquete «detalle»; para publicar hay que volver a hacer `npm run build` sin la variable.
- **Archivos de configuración tocados**: `playwright.config.ts`, `playwright.real.config.ts`, nuevo `playwright.h4.config.ts` y el script `test:e2e:h4` en `package.json`.
