# Estado actual del SVAS

## Último checkpoint
2026-11-04 21:23 (Lima) · rama `feat/f6-seguimiento` · último commit `cc75f80`

## Fase y paso actual
**F6 · Seguimiento (CU-04)**: listo; en `cerrar-fase` (PR #7 + CI). F0–F5 mergeadas (#1–#6). Alcance: F0 → F9.

## Qué funciona y cómo verlo
- Asesor (asesor1@svas.demo/Asesor123!) → /asesor → pestaña Seguimiento: intentos solo por el canal preferido, 4 máximo, cierre con motivo, mensaje final único, reenvío.
- Cliente: /retomar/:token → compra con canal TELEMARKETING; vencido → «Este enlace ya venció».
- Job cada minuto (abandonos > 30 min y cierres automáticos); `JOB_SEGUIMIENTO=false` lo apaga. Botón de demo en F8.
- `npm test`: api 229 · web 27.

## Siguiente paso exacto
Cerrar F6 y crear `feat/f7-administracion`: `apps/api/src/administracion/` (catálogo, campos y valores, reglas de inspección, parámetros, actividad, reportes), web panel-admin con Recharts, luego auditor y `docs/GUIA_DEMO.md`.

## Decisiones Propuesta que esperan visto bueno
Ninguna.

## Riesgos o deudas
- Windows real de Denis no verificado a mano (CI windows verde).

## Estado del CI
F0–F5 ✅ ubuntu / ✅ windows. F6: pendiente.
