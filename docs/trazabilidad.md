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
| RF-01 / RF-02 / RN-17 | Formulario dinámico = unión de campos de aseguradoras activas + base fijos | `dominio-compartido/catalogo/formulario.ts`, `catalogo.controller.ts`, `web/pages/cotizador/Cotizador.tsx` | `formulario.spec.ts` (RN-17, D-26), `cotizacion.e2e-spec.ts` (RF-02), `cotizador.test.tsx` (RF-02) | F3 |
| RF-03 | Validación por catálogo con errores por campo | `formulario.ts` (`validarContraCatalogo`), `comun/validacion.ts` | `formulario.spec.ts` (RF-03 ×2), `cotizacion.e2e-spec.ts` (RF-03), `cotizador.test.tsx` (RF-03) | F3 |
| RF-04 / RN-18…RN-24 / RN-26 | Estrategia por aseguradora con tarifas de prueba | `cotizacion/estrategia/*` | `estrategias.spec.ts` (RN-18…RN-22, D-10) | F3 |
| RF-05 | Comparativo; si una aseguradora no cotiza, las demás se muestran | `cotizacion.service.ts` (`detalle`), `web/pages/cotizador/Comparativo.tsx` | `cotizacion.e2e-spec.ts` (RF-05, 4a), `calcular-opciones.spec.ts` (4a), `cotizador.test.tsx` (RF-05) | F3 |
| RF-06 / RN-04 | No asegurable → derivación automática sin pedir correo | `calcular-opciones.ts`, `derivador-casos.ts` | `calcular-opciones.spec.ts` (RN-04), `cotizacion.e2e-spec.ts` (RN-04), `estrategias.spec.ts` (RN-04) | F3 (solicitud real en F5) |
| RF-07 | Registro único de cliente y vehículo | `dominio-compartido/cliente/registro-unico.service.ts` | `cotizacion.e2e-spec.ts` (RF-07) | F3 |
| RF-08 / RN-01 / RN-02 | Opción 1 y 2 por plan | `calcular-opciones.ts`, `Comparativo.tsx` | `calcular-opciones.spec.ts` (RN-01, RN-02), `cotizador.test.tsx` (RF-08) | F3 |
| RF-10 / RN-03 / RN-25 | Inspección por aseguradora × uso bloquea la Opción 1 | `calcular-opciones.ts`, `catalogo.service.ts` | `calcular-opciones.spec.ts` (RN-03, RN-25), `cotizacion.e2e-spec.ts` (RN-03), `cotizador.test.tsx` (RF-10) | F3 |
| RN-05 | Fuera de nicho: sin cotización ni solicitud | `cotizacion/dominio/evaluar-nicho.ts` | `evaluar-nicho.spec.ts` (×5), `cotizacion.e2e-spec.ts` (RN-05 ×2), `cotizador.test.tsx` (RN-05) | F3 |
| RNF-12 (cotización) | Cada cotización queda en RegistroActividad | `cotizacion.service.ts` | `cotizacion.e2e-spec.ts` (RNF-12) | F3 |
| RF-32 (cotización) | Cliente A no ve la cotización de B; invitado no ve la de un cliente con cuenta | `cotizacion.service.ts` (`detalle`), `propiedad.ts` | `cotizacion.e2e-spec.ts` (RF-32 / D-36) | F3 |
