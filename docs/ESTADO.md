# Estado actual del SVAS

## Último checkpoint
2026-11-04 20:55 (Lima) · rama `feat/f3-cotizacion` · último commit `4b099ee`

## Fase y paso actual
**F3 · Cotizar y comparar (CU-01)**: lista; en `cerrar-fase` (PR #4 + CI). F0–F2 mergeadas (#1–#3). Alcance: F0 → F9.

## Qué funciona y cómo verlo
- `npm run dev` → http://localhost:5173/cotizar: formulario dinámico; comparativo en /cotizacion/:id.
- Casos de demo verificados a 360 px: auto 2022 (15 planes), 2009 (Rímac y La Positiva no cotizan), 2003 (no asegurable, derivado), taxi (solo Opción 2), camión (fuera de nicho).
- Login: admin@svas.demo/Admin123!, asesor1@svas.demo/Asesor123!, cliente@svas.demo/Cliente123!.
- `npm test`: api 74 + web 12.

## Siguiente paso exacto
Cerrar F3 y crear `feat/f4-compra`: `apps/api/src/compra/dominio/{descuentos,atribuir-canal}.ts`, puertos en `integracion/` (pasarela, aseguradora, pdf), `POST /api/compras` … `/pagar` en UNA transacción, PDF, web pago-poliza y mis-trámites.

## Decisiones Propuesta que esperan visto bueno
Ninguna. Nuevas Tomadas: D-46 (registro único de invitados), D-47 (fuera de nicho = 201 con mensaje).

## Riesgos o deudas
- `DerivadorCasosTemporal` solo registra actividad; la solicitud real llega en F5.
- PDFs de las 80 pólizas históricas: se regeneran al pedirlos (F4).
- Windows real de Denis no verificado a mano (CI windows verde).

## Estado del CI
F0–F2 ✅ ubuntu / ✅ windows. F3: pendiente.
