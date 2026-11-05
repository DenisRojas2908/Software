# Estado actual del SVAS

## Último checkpoint
2026-11-04 22:21 (Lima) · rama `feat/f10-despliegue` (creada desde `main` tras mergear F9) · `main` en `195396d`

## Fase y paso actual
**F0–F9 terminadas y mergeadas en `main`** (PR #1–#10, CI verde en ubuntu y windows en todas). **F10 · Despliegue**: paso 0, pendiente con Denis (necesita su laptop y, si piden URL pública, cuentas de Railway/Supabase).

## Qué funciona y cómo verlo
- `npm install` → copiar `apps/api/.env.example` a `.env` → `npm run db:reset` → `npm run dev` (http://localhost:5173) o `npm run build` + `npm start` (http://localhost:3000).
- Usuarios: admin@svas.demo/Admin123! · asesor1@svas.demo/Asesor123! · cliente@svas.demo/Cliente123!
- Guion de la sustentación: `docs/GUIA_DEMO.md` (ensayado: 0 fallas, 59 verificaciones). Manuales: `docs/manual-usuario.md`, `docs/manual-administrador.md`.
- `npm test`: api 327 · web 43. `npm run test:cobertura`: api 97,8 % (dominio 100 %), web 85,6 %. Carga: comparativo p97,5 235 ms (c=50); cotizar 96/s, p97,5 450 ms (c=20).

## Siguiente paso exacto
Con Denis, en su Windows: `npm install`, crear las bases `svas` y `svas_test`, `npm run db:reset`, `npm run dev` y `npm test` (criterio de F0 en Windows real). Luego F10 (docs/03-plan.md): solo si piden URL pública → Railway + Supabase con pooler en modo sesión (D-21). Checklist del día de la sustentación y plan B local.

## Decisiones Propuesta que esperan visto bueno
Ninguna. Últimas Tomadas: D-57…D-60.

## Riesgos o deudas
- Windows real de Denis no verificado a mano (el CI windows está en verde en todas las fases).
- `npm run db:reset` lo bloquea Prisma si lo lanza un agente (Denis sí puede, D-44).
- El ensayo automático de la demo necesita Playwright (viene en la nube; no está en el proyecto).

## Estado del CI
F0–F9 ✅ ubuntu / ✅ windows.
