# Estado actual del SVAS

## Último checkpoint
2026-11-04 21:19 (Lima) · rama `feat/f5-asesoria` · último commit `48a4c92`

## Fase y paso actual
**F5 · Asesoría (CU-03)**: lista; en `cerrar-fase` (PR #6 + CI). F0–F4 mergeadas (#1–#5). Alcance: F0 → F9.
Sin commit (adelanto de F6): `retencion/dominio/seguimiento.ts` (+spec), `retencion/retencion.service.ts`, `integracion/notificador/`.

## Qué funciona y cómo verlo
- Taxi en /cotizar → asesor1@svas.demo/Asesor123! en /asesor: aparece primero con «Derivado»; tomar → descuento (12 % rechazado, 8 % ok) → «Cliente acepta» → el cliente compra con canal ASESORIA.
- «Prefiero que me asesoren» en el comparativo → /asesoria/:id (confirmación con tiempo estimado).
- `npm test`: api 184 en git (+10 de F6 sin commit) · web 23.

## Siguiente paso exacto
Cerrar F5 y crear `feat/f6-seguimiento`: registrar `RetencionService` y `NOTIFICADOR` en los módulos, controller `/api/asesor/seguimientos` + `/api/retoma/:token`, tests e2e con reloj adelantado, web pestaña Seguimiento y `retomar/:token`.

## Decisiones Propuesta que esperan visto bueno
Ninguna.

## Riesgos o deudas
- Windows real de Denis no verificado a mano (CI windows verde).

## Estado del CI
F0–F4 ✅ ubuntu / ✅ windows. F5: pendiente.
