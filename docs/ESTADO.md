# Estado actual del SVAS

## Último checkpoint
2026-11-04 21:15 (Lima) · rama `feat/f4-compra` · último commit `3738e33`

## Fase y paso actual
**F4 · Compra autónoma (CU-02)**: lista y auditada (auditor: 0 bloquea, 8 corregir → corregidos, 13 menores → 11 corregidos). En `cerrar-fase` (PR #5 + CI). F0–F3 mergeadas. Alcance: F0 → F9.
En el árbol de trabajo (sin commit) hay avances de F5/F6: `apps/api/src/asesoria-retencion/`, `integracion/notificador/`, `test/asesoria.e2e-spec.ts`, panel del asesor y selección de canal.

## Qué funciona y cómo verlo
- `npm run dev` → /cotizar → «Comprar ahora» → crear cuenta → DNI → cuotas → «Pagar (simulado)» → descargar PDF; /mis-tramites.
- cliente@svas.demo/Cliente123! no recibe el 5 % (DNI con póliza previa). Rechazo y emisión fallida se fuerzan con `SimuladorFallos` (panel de demo en F8).
- `npm test`: api 148 (+12 unitarias de F5/F6 sin commit) · web 19.

## Siguiente paso exacto
Cerrar F4 (PR → CI → merge) y crear `feat/f5-asesoria`: commitear el trabajo adelantado de F5 (quitar `DerivadorCasosTemporal` de `cotizacion.module.ts`, registrar `AsesoriaRetencionModule` en `app.module.ts`, endpoints en `test/soporte/endpoints.ts`).

## Decisiones Propuesta que esperan visto bueno
Ninguna. Nuevas Tomadas: D-48 (modelo del año siguiente), D-49 (usuario inactivo pierde acceso), D-50 (reloj fijo en pruebas).

## Riesgos o deudas
- Menores del auditor pendientes: cobertura con `it('RN-xx')` de RN-15 es indirecta vía e2e (aceptable).
- Windows real de Denis no verificado a mano (CI windows verde).

## Estado del CI
F0–F3 ✅ ubuntu / ✅ windows. F4: pendiente.
