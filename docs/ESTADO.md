# Estado actual del SVAS

## Último checkpoint
2026-11-04 22:16 (Lima) · rama `feat/f9-pruebas-manuales` · último commit `fa39109`

## Fase y paso actual
**F9 · Pruebas, calidad y manuales**: lista y auditada (auditor final: 0 bloquea, 3 corregir y 10 menores, todo corregido). En `cerrar-fase` (PR #10 + CI). F0–F8 mergeadas (#1–#9). **Alcance de la sesión (F0–F9) cumplido**; F10 (despliegue) queda para la laptop de Denis.

## Qué funciona y cómo verlo
- `npm install` → copiar `apps/api/.env.example` a `.env` → `npm run db:reset` → `npm run dev` (http://localhost:5173) o `npm run build` + `npm start` (http://localhost:3000).
- Usuarios: admin@svas.demo/Admin123! · asesor1@svas.demo/Asesor123! · cliente@svas.demo/Cliente123!
- Guion de la sustentación: `docs/GUIA_DEMO.md` (ensayado: 0 fallas, 59 verificaciones). Manuales: `docs/manual-usuario.md`, `docs/manual-administrador.md`.
- `npm test`: api 327 · web 43. `npm run test:cobertura`: api 97,8 % (dominio 100 %), web 85,6 %. Carga: comparativo p97,5 235 ms (c=50); cotizar 96/s, p97,5 450 ms (c=20).

## Siguiente paso exacto
Mergear PR #10 con el CI verde. Luego, con Denis: F10 (si piden URL pública: Railway + Supabase con pooler IPv4, D-21) y verificar en su Windows `npm install`, `npm run dev` y `npm run db:reset`.

## Decisiones Propuesta que esperan visto bueno
Ninguna. Últimas Tomadas: D-57…D-60.

## Riesgos o deudas
- Windows real de Denis no verificado a mano (el CI windows está en verde en todas las fases).
- `npm run db:reset` lo bloquea Prisma si lo lanza un agente (Denis sí puede, D-44).
- El ensayo automático de la demo necesita Playwright (viene en la nube; no está en el proyecto).

## Estado del CI
F0–F8 ✅ ubuntu / ✅ windows. F9: pendiente.
