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
| RF-09 | Opción 1: elegir plan, completar solo datos faltantes, confirmar sin asesor | `compra/compra.service.ts`, `web/pages/pago-poliza/*` | `compra.e2e-spec.ts` (CU-02 completo), `pago-poliza.test.tsx` (RNF-08) | F4 |
| RF-10 (compra) | No se compra en Opción 1 un plan con inspección | `compra/dominio/habilitacion.ts` | `habilitacion.spec.ts` (RF-10, RN-04), `compra.e2e-spec.ts` (1a) | F4 |
| RF-20 / RN-08 | Primera compra 5 % por DNI sin póliza previa, registrada en la cotización | `compra.service.ts` (`contexto`, `completarDatos`), `descuentos.ts` | `descuentos.spec.ts` (RN-08 ×2), `compra.e2e-spec.ts` (CU-02 5 %, RN-08 cliente demo), `pago-poliza.test.tsx` (RN-08) | F4 |
| RN-07 (dominio) | Negociado ≤ máximo: se rechaza al registrar | `descuentos.ts` (`validarDescuentoNegociado`) | `descuentos.spec.ts` (RN-07 ×2) | F4 (uso real en F5) |
| RN-09 | Primera compra y negociado no se acumulan; el mayor, con tope | `descuentos.ts` (`resolverDescuento`) | `descuentos.spec.ts` (RN-09 ×3) | F4 |
| RN-14 | Pago único o en cuotas ≤ máximo; cronograma | `pagos/dominio/cuotas.ts` | `cuotas.spec.ts` (RN-14 ×3), `compra.e2e-spec.ts` (RN-14), `pago-poliza.test.tsx` (RN-14) | F4 |
| RF-22 | Emisión vía puerto con número de prueba | `integracion/aseguradora/*` | `compra.e2e-spec.ts` (número SVAS-RIMAC-…) | F4 |
| RF-23 | Pago único/cuotas vía pasarela reemplazable | `integracion/pasarela/*`, `compra.service.ts` (`pagar`) | `compra.e2e-spec.ts` (cuotas, 5a) | F4 |
| RF-24 | Firma simulada obligatoria | `compra.service.ts` (`confirmar`) | `compra.e2e-spec.ts` (RF-24), `pago-poliza.test.tsx` (RF-24) | F4 |
| RF-25 / RN-15 / RNF-20 | PDF tras pago confirmado, con leyenda de demostración | `integracion/pdf/*`, `polizas/poliza.service.ts`, `polizas.controller.ts` | `compra.e2e-spec.ts` (PDF %PDF, histórica), `pago-poliza.test.tsx` (RF-25) | F4 |
| RF-26 | El cliente consulta solicitud, pago y póliza | `polizas/poliza.service.ts` (`misTramites`), `web/pages/mis-tramites/MisTramites.tsx` | `compra.e2e-spec.ts` (mis trámites), `mis-tramites.test.tsx` (RF-26) | F4 |
| RNF-05 | Pago + emisión + póliza + estados en una transacción; rollback si falla la emisión | `compra.service.ts` (`pagar`) | `compra.e2e-spec.ts` (RNF-05 / 6a), `restricciones-bd.e2e-spec.ts` (índice parcial) | F4 |
| RN-27 (dominio) | Canal por origen de la compra (incluye caso mixto D-30) | `compra/dominio/atribuir-canal.ts` | `atribuir-canal.spec.ts` (×6), `compra.e2e-spec.ts` (AUTONOMO) | F4 (ASESORIA en F5, TELEMARKETING en F6) |
| D-08 | Pago sin tarjeta, CVV ni datos bancarios | `web/pages/pago-poliza/PagoPoliza.tsx` | `pago-poliza.test.tsx` (D-08) | F4 |
| RF-32 (compra) | Otra cuenta no ve, paga ni descarga | `compra.service.ts` (`cargarOrden`), `poliza.service.ts` (`rutaPdf`) | `compra.e2e-spec.ts` (RF-32), `permisos.e2e-spec.ts` (7 endpoints nuevos) | F4 |
| RN-06 | La Opción 1 no admite negociación (el precio enviado por el cliente se ignora) | `compra/compra.service.ts` (`crearOrden`) | `compra.e2e-spec.ts` (RN-06) | F4 |
| RN-15 / RN-26 | Póliza y PDF solo tras pago confirmado; número de póliza de prueba | `compra.service.ts`, `integracion/aseguradora/emisor-simulado.ts` | `compra.e2e-spec.ts` (RN-15 / RN-26) | F4 |
| RN-16 | Aseguradora/plan desactivado fuera de nuevas cotizaciones; lo registrado se conserva | `catalogo.service.ts` (`aseguradorasActivas`, `formulario`) | `cotizacion.e2e-spec.ts` (RN-16) | F4 (auditoría) |
| RN-23 / RN-24 | Conjunto común (Mapfre, Quálitas); Mapfre con Opción 1 y 2 | `prisma/seed.ts`, `calcular-opciones.ts` | `cotizacion.e2e-spec.ts` (RN-23, RN-24) | F4 (auditoría) |
| D-30 | Compra habilitada por asesoría: solicitud ACEPTA o negociado aceptado del MISMO plan | `compra/dominio/habilitada-por-asesoria.ts` | `habilitada-por-asesoria.spec.ts` (×4) | F4 (auditoría) |
| D-48 | Modelo del año siguiente cotiza con antigüedad 0 | `cotizacion/estrategia/tarifa-prueba.ts` | `estrategias.spec.ts` (D-48) | F4 (auditoría) |
| D-49 | Usuario desactivado pierde el acceso al instante | `seguridad/autenticacion.guard.ts` | `seguridad.e2e-spec.ts` (RF-31 corte, 404/400) | F4 (auditoría) |
