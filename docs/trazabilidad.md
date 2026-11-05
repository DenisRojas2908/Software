# Trazabilidad RF / RN / CU → código → pruebas

Se actualiza en cada fase. Una fila por requisito o regla implementada.

| ID | Descripción corta | Archivo(s) | Test(s) | Fase |
|---|---|---|---|---|
| D-01 / RNF-18 | Un proceso, una URL; SPA consume `/api/*` | `apps/api/src/app.module.ts`, `apps/api/src/app.ts`, `apps/web/vite.config.mts` | `apps/api/test/salud.e2e-spec.ts` (F0: responde ok con el prefijo /api) | F0 |
| D-19 / RNF-20 (UI) | Aviso de simulación académica en toda la UI | `apps/web/src/componentes/AvisoSimulacion.tsx` | `apps/web/src/App.test.tsx` | F0 |
