# Estado actual del SVAS

## Último checkpoint
2026-11-04 21:55 (Lima) · rama `feat/f8-demo` · último commit `269c589`

## Fase y paso actual
**F8 · Modo demo**: listo; en `cerrar-fase` (PR #9 + CI). F0–F7 mergeadas (#1–#8). Sigue F9 (cobertura, tests de web, manuales con capturas, auditor final).

## Qué funciona y cómo verlo
- `DEMO_MODE=true` en `apps/api/.env` → admin@svas.demo/Admin123! → menú **Demo**: reloj, fallos, procesar abandonos, buzón, reiniciar BD. Con `DEMO_MODE=false` no existe (404).
- Guion: `docs/GUIA_DEMO.md`. Ensayo automático: app corriendo + `node scripts/guion-demo.cjs capturas-demo` → última corrida: 0 fallas, 58 verificaciones, 33 pantallas, 54 s.
- `npm test`: api 324 · web 33.

## Siguiente paso exacto
Cerrar F8 y crear `feat/f9-pruebas-manuales`: cobertura (`jest --coverage`, meta ≥ 70 % en dominio), tests de web faltantes, `docs/manual-usuario.md` y `docs/manual-administrador.md` con capturas del guion, auditor final.

## Decisiones Propuesta que esperan visto bueno
Ninguna. Nuevas Tomadas: D-55 (demo solo con DEMO_MODE), D-56 (seed en src).

## Riesgos o deudas
- `npm run db:reset` lo bloquea Prisma si lo ejecuta un agente (Denis sí puede); los agentes usan migrate deploy + seed (D-44).
- Windows real de Denis no verificado a mano (CI windows verde).

## Estado del CI
F0–F7 ✅ ubuntu / ✅ windows. F8: pendiente.
