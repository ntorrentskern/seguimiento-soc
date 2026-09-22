# Seguimiento SOC

Panel interno de Kern Pharma para seguir el SOC mes a mes y, cuando lleguen, los informes de vigilancia digital.

Se guarda lo que sirve para ver la evolución: alertas generadas, escaladas, falsos positivos, alertas sin respuesta, casos concretos, vulnerabilidades que hay que seguir y acciones. No se guarda la introducción, la metodología, los avisos legales ni las recomendaciones que se copian igual en todos los PDF.

## Desarrollo

```bash
npm install
npm run dev
```

La base de datos es Neon (`DATABASE_URL`). El esquema se aplica con `npm run db:push`. Los meses se cargan desde `data/soc.json` (no se sube a git) con `npm run db:seed`.

El proyecto de Vercel ya tiene protección de acceso del equipo.
