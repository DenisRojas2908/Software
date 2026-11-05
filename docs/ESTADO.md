# Estado actual del SVAS

## Último checkpoint
2026-11-04 20:34 (Lima) · rama `feat/f0-arranque` · último commit `8b9c38b`

## Fase y paso actual
**F0 · Arranque**: código terminado. En curso `cerrar-fase` (PR a main + CI). Alcance de la sesión: F0 → F9 (F10 queda para la laptop de Denis).

## Qué funciona y cómo verlo
- `npm install` → `npm run dev`: API http://localhost:3000/api/salud y web http://localhost:5173 (proxy /api verificado).
- `npm run build` → `npm start`: un proceso en http://localhost:3000 (SPA + /api). /api inexistente → 404.
- `npm test`: 2 pruebas (api salud, web aviso). `npm run lint` limpio. Inicio verificado a 360 px sin desborde.
- Aún no hay usuarios demo (llegan con el seed de F1).

## Siguiente paso exacto
Abrir el PR `feat/f0-arranque` → main, esperar el CI (ubuntu + windows), mergear y crear `feat/f1-modelo-datos`. Luego F1: `apps/api/prisma/schema.prisma` (22 tablas, 16 enums, + `vehiculo.datos_adicionales`).

## Decisiones Propuesta que esperan visto bueno
Ninguna. D-11, D-21…D-24 y D-25…D-43 están Tomadas.

## Riesgos o deudas
- Windows real de Denis no verificado a mano (lo cubre el job windows del CI).
- Prisma 7: el generador `prisma-client-js` hay que confirmarlo en F1 (puede requerir `prisma-client` + adapter-pg).
- `incremental` desactivado en apps/api/tsconfig (con `deleteOutDir` dejaba dist vacío).

## Estado del CI
Primer run pendiente (al hacer push). ubuntu: — · windows: —
