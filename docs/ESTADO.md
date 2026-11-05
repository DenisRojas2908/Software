# Estado actual del SVAS

## Último checkpoint
2026-11-04 20:47 (Lima) · rama `feat/f2-seguridad` · último commit `1781ee9`

## Fase y paso actual
**F2 · Seguridad**: lista; en `cerrar-fase` (PR #3 + CI). F0 (#1) y F1 (#2) mergeadas. Alcance: F0 → F9.

## Qué funciona y cómo verlo
- `npm run dev` → http://localhost:5173/login: ingresar / crear cuenta. Menú y rutas por rol (/mis-tramites, /asesor, /admin).
- Usuarios: admin@svas.demo/Admin123!, asesor1@svas.demo/Asesor123!, cliente@svas.demo/Cliente123!.
- API: POST /api/auth/registro, POST /api/auth/login, GET /api/auth/yo, /api/admin/usuarios (GET/POST/PATCH, solo admin).
- `npm test`: api 41 (incl. 16 casos endpoints × roles) + web 6.

## Siguiente paso exacto
Cerrar F2 (PR → CI → merge) y crear `feat/f3-cotizacion`: `apps/api/src/cotizacion/estrategia/*` (5 estrategias + `primaDePrueba`), `cotizacion/dominio/calcular-opciones.ts`, catálogo/formulario, `POST /api/cotizaciones`.

## Decisiones Propuesta que esperan visto bueno
Ninguna.

## Riesgos o deudas
- F2 «cliente A no ve la cotización de B»: probado a nivel de dominio (`propiedad.spec.ts`); la prueba HTTP llega en F3 cuando existan cotizaciones.
- Token en localStorage (aceptable para la simulación; en producción iría en cookie httpOnly).
- Windows real de Denis no verificado a mano (CI windows verde).

## Estado del CI
F0 ✅✅ · F1 ✅✅ (ubuntu/windows). F2: pendiente.
