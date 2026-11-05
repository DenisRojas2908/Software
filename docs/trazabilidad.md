# Trazabilidad RF / RN / CU → código → pruebas

Se actualiza en cada fase. Una fila por requisito o regla implementada.

| ID | Descripción corta | Archivo(s) | Test(s) | Fase |
|---|---|---|---|---|
| D-01 / RNF-18 | Un proceso, una URL; SPA consume `/api/*` | `apps/api/src/app.module.ts`, `apps/api/src/app.ts`, `apps/web/vite.config.mts` | `apps/api/test/salud.e2e-spec.ts` (F0: responde ok con el prefijo /api) | F0 |
| D-19 / RNF-20 (UI) | Aviso de simulación académica en toda la UI | `apps/web/src/componentes/AvisoSimulacion.tsx` | `apps/web/src/App.test.tsx` | F0 |
| 02 §9 / D-27 | 22 tablas, 16 enums, 25 FK; FK compuesta orden → prima de su propia cotización | `apps/api/prisma/schema.prisma`, `prisma/migrations/*_init` | `test/restricciones-bd.e2e-spec.ts` (FK compuesta) | F1 |
| RN-07 (BD) | Descuento ≤ máximo (trigger T2) | `prisma/migrations/*_restricciones` | `restricciones-bd.e2e-spec.ts` (RN-07 / T2) | F1 |
| RN-10 (BD) | Intentos ≤ máximo (trigger T6) | `*_restricciones` | `restricciones-bd.e2e-spec.ts` (RN-10 / T6) | F1 |
| RN-11 (BD) | DESCARTADO exige motivo (CHECK) | `*_restricciones` | `restricciones-bd.e2e-spec.ts` (RN-11) | F1 |
| RN-14 (BD) | Cuotas ≤ máximo (trigger T3) | `*_restricciones` | `restricciones-bd.e2e-spec.ts` (RN-14 / T3) | F1 |
| RNF-05 (BD) | Un solo pago confirmado por orden (índice parcial + T4) | `*_restricciones` | `restricciones-bd.e2e-spec.ts` (índice parcial) | F1 |
| D-24 | Parámetros en una sola fila (T5); T1 asesor válido | `*_restricciones` | `restricciones-bd.e2e-spec.ts` (T5, T1) | F1 |
| RNF-13 (seed) | Valores de negocio solo en el seed | `apps/api/prisma/seed.ts:7-14` | `restricciones-bd.e2e-spec.ts` (seed) | F1 |
| RF-31 | Autenticación (login, registro, JWT con expiración) y admin gestiona usuarios | `seguridad/auth.service.ts`, `seguridad/auth.controller.ts`, `administracion/usuarios.controller.ts` | `test/seguridad.e2e-spec.ts` (RF-31 ×4) | F2 |
| RF-32 | Impedir acceso a otro rol / a datos de otro cliente | `seguridad/autenticacion.guard.ts`, `seguridad/propiedad.ts`, `web/componentes/RutaProtegida.tsx` | `test/permisos.e2e-spec.ts`, `src/seguridad/propiedad.spec.ts`, `web/componentes/seguridad.test.tsx` | F2 |
| RNF-09 | bcrypt + sesión con expiración | `seguridad/auth.service.ts` | `seguridad.e2e-spec.ts` (RNF-09) | F2 |
| RNF-10 | 100 % de endpoints protegidos rechazan otro rol (tabla endpoints × roles) | `test/soporte/endpoints.ts` | `test/permisos.e2e-spec.ts` | F2 (se amplía en cada fase) |
| RF-11 (registro) | Registro mínimo de cliente con errores por campo | `seguridad/auth.controller.ts`, `web/pages/login/Login.tsx` | `seguridad.e2e-spec.ts` (RF-11 ×2), `seguridad.test.tsx` (RF-11) | F2 |
| D-36 | Cotización sin dueño se lee por uuid; con dueño, solo él | `seguridad/propiedad.ts` | `propiedad.spec.ts` (D-36) | F2 |
| D-07 | Reloj ajustable (demo) y fijo (pruebas) | `comun/reloj.ts` | `src/comun/reloj.spec.ts` | F2 |
