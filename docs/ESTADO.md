# Estado actual del SVAS

## Último checkpoint
2026-11-04 21:42 (Lima) · rama `feat/f7-administracion` · último commit `b18a8fc`

## Fase y paso actual
**F7 · Administración (CU-05)**: lista y auditada (auditor F0–F7: 2 bloquea, 3 corregir, 12 menores → todos corregidos). En `cerrar-fase` (PR #8 + CI). F0–F6 mergeadas (#1–#7). Ya está la base del modo demo (F8) sin registrar.

## Qué funciona y cómo verlo
- admin@svas.demo/Admin123! → /admin: Reportes (Recharts), Aseguradoras y planes, Campos (+ campo nuevo), Inspección, Parámetros, Usuarios, Actividad. Desactivar Quálitas cambia /cotizar sin reiniciar (verificado en el navegador).
- Guion completo en `docs/GUIA_DEMO.md` (los pasos 6–8 usan la página Demo de F8).
- `npm test`: api 305 · web 30.

## Siguiente paso exacto
Cerrar F7 y crear `feat/f8-demo`: registrar `DemoModule` solo con DEMO_MODE (AppModule.forRoot), ruta /demo en la web, tests 404 (DEMO_MODE=false) / 403 (rol ≠ admin) en api y web, skill `demo` con capturas a 360 y 1366 px.

## Decisiones Propuesta que esperan visto bueno
Ninguna. Nuevas Tomadas: D-51 (caso aceptado no se descarta), D-52 (prima manual solo en derivados), D-53 (asesoría aceptada no es abandono), D-54 (admin no se desactiva a sí mismo).

## Riesgos o deudas
- Windows real de Denis no verificado a mano (CI windows verde).

## Estado del CI
F0–F6 ✅ ubuntu / ✅ windows. F7: pendiente.
