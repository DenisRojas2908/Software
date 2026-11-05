# Bitácora del proyecto SVAS

Solo se agrega; la entrada más reciente va arriba. Formato por checkpoint: fecha y hora (Lima) · fase · qué se hizo · archivos tocados · decisiones · pruebas · «Para defender» · siguiente paso.

---

## 2026-11-04 22:16 (Lima) · F9 · Pruebas, calidad y documentación + auditoría final
- **Qué se hizo**: F8 mergeada (PR #9). Cobertura con umbrales (`npm run test:cobertura`): api 97,8 % líneas (dominio 100 %), web 85,6 %; pruebas web nuevas (inicio de compra, login, pestañas del admin). **Prueba de carga** (autocannon): encontró que cotizar bajo concurrencia agotaba el pool (2/s y errores) por lecturas de catálogo dentro de la transacción → corregido (96/s, p97,5 450 ms, 0 errores); comparativo p97,5 235 ms con 50 conexiones (RNF-01). Manuales de usuario y administrador con 30 capturas reales. **Auditor final**: 0 bloquea, 3 corregir (CONVERTIDA reabierta por asesoría, resumen dentro del try del pago, paso 9 de la guía sin efecto visible) y 10 menores; todos corregidos (D-57…D-60). Guion re-ensayado: 0 fallas, 59 verificaciones.
- **Errores encontrados y resueltos**: un `prettier --write docs/*.md` reformateó documentos que no se deben tocar (incluido 02-especificacion.md); se revirtió con git antes de commitear y se agregó `docs` a `.prettierignore` (D-60).
- **Archivos tocados**: `apps/api/{jest.config.js,src/cotizacion,src/compra,src/asesoria-retencion,src/polizas}`, `apps/web/{jest.config.cjs,src/pages/*}`, `docs/{manual-usuario,manual-administrador,GUIA_DEMO,trazabilidad,sustentacion}.md`, `docs/capturas/`, `scripts/guion-demo.cjs`.
- **Decisiones**: D-57, D-58, D-59, D-60.
- **Pruebas**: api 327 · web 43. Cubren RNF-16 (umbrales), RNF-01 (carga), 02 §7, CU-03 1a, RF-20.
- **Para defender**:
  1. *Prueba de carga* (`sustentacion.md` F9): «¿soporta varios clientes a la vez?» → Se midió, se encontró un cuello de botella real y se corrigió (2 → 96 cotizaciones/s).
  2. *Calidad verificable*: 370 pruebas, cobertura con umbral en el CI, y 3 auditorías independientes con sus hallazgos corregidos.
- **Siguiente paso**: mergear F9. F10 con Denis.

## 2026-11-04 21:55 (Lima) · F8 · Modo simulación y guion de demo
- **Qué se hizo**: F7 mergeada (PR #8). `AppModule.forRoot()` registra `DemoModule` solo con DEMO_MODE (D-55). Endpoints `/api/demo/*` (solo ADMINISTRADOR) y página Demo. Pruebas obligatorias: 404 con DEMO_MODE=false (también como admin y sin token), 401/403 con DEMO_MODE=true para quien no es admin, menú y ruta ocultos en la web. Skill `demo` ejecutada: `scripts/guion-demo.cjs` recorre los 10 pasos de `GUIA_DEMO.md` → 0 fallas, 58 verificaciones, 66 capturas (360/1366), 54 s.
- **Errores encontrados y resueltos (en el script, no en la app)**: esperas antes de que cargara la página de datos faltantes; checkboxes controlados (cambian al responder la API) → `click()`; el estado del reloj persistía entre corridas → el script lo reinicia al empezar.
- **Archivos tocados**: `apps/api/src/{app.module.ts,app.ts,demo/*,persistencia/seed-datos.ts}`, `apps/api/test/demo.e2e-spec.ts`, `apps/web/src/{App.tsx,pages/demo/*}`, `scripts/guion-demo.cjs`, `.claude/skills/demo/SKILL.md`.
- **Decisiones**: D-55, D-56.
- **Pruebas**: api 324 · web 33. Cubren RNF-10/RF-32 para `/api/demo/*`, D-06, D-07, D-12.
- **Para defender**:
  1. *Demo segura* (`app.module.ts`): «¿y si dejan DEMO_MODE en producción?» → Igual exige ADMINISTRADOR; y con false las rutas no existen.
  2. *Ensayo automatizado* (`scripts/guion-demo.cjs`): «¿cómo garantizan que la demo no falle?» → Se ensayó de punta a punta con un navegador real.
- **Siguiente paso**: cerrar F8 y empezar F9.

## 2026-11-04 21:42 (Lima) · F7 · Catálogo, parámetros, usuarios y reportes (CU-05) + auditoría F0–F7
- **Qué se hizo**: F6 mergeada (PR #7). Dominio: `agruparVentas`, `validarParametros`. `AdministracionService`: catálogo, campos y valores (campo nuevo → `datos_adicionales`), inspección, parámetros, actividad y reportes; cada cambio + actividad en una transacción. Web: panel admin con 7 pestañas y Recharts. `GUIA_DEMO.md`. Seed movido a `src/persistencia/seed-datos.ts` con fecha inyectada. Base del modo demo (F8). **Auditor F0–F7**: 2 bloquea (caso aceptado descartado por el job, con el enlace invalidado; prima manual que saltaba el tope), 3 corregir (CU-04 3b, literal 1800.90, suites en paralelo) y 12 menores. Todos corregidos (D-51…D-54).
- **Errores encontrados y resueltos**: una corrida fallida de Playwright dejó Quálitas desactivada en la BD de desarrollo (se restauró y se verificó de nuevo desde un estado limpio); lint de react-hooks por `setState` dentro de un efecto en Parámetros (se cambió por un formulario hijo con estado inicial).
- **Archivos tocados**: `apps/api/src/administracion/*`, `asesoria-retencion/*` (correcciones), `compra.service.ts`, `poliza.service.ts`, `persistencia/seed-datos.ts`, `apps/api/test/*`, `apps/web/src/pages/panel-admin/*`, `docs/GUIA_DEMO.md`.
- **Decisiones**: D-51, D-52, D-53, D-54.
- **Pruebas**: api 305 · web 30. Cubren RF-27…RF-31, RN-16, RN-25, RNF-12, RNF-13, CU-04 3b, D-51, D-52.
- **Para defender**:
  1. *Configuración sin código* (`administracion.service.ts`): «demuéstrenlo» → desactivar Quálitas en /admin y recargar /cotizar.
  2. *Auditoría independiente*: «¿cómo encontraron errores de lógica?» → El subagente auditor encontró que el job descartaba casos aceptados; se corrigió con prueba (D-51).
- **Siguiente paso**: cerrar F7 y empezar F8 (modo demo).

## 2026-11-04 21:23 (Lima) · F6 · Seguimiento de telemarketing (CU-04)
- **Qué se hizo**: F5 mergeada (PR #6). Clase de dominio `Seguimiento` (puedeContactar, cierre automático, cerrar con motivo, enlace). `RetencionService`: job de abandonos y cierres, cola con plan sugerido (D-29), intentos (ACEPTA genera enlace), cierre + mensaje final único con enlace de 7 días (D-34), reenvío, retoma pública. Puerto `Notificador` simulado. Web: pestaña Seguimiento y `retomar/:token`.
- **Archivos tocados**: `apps/api/src/asesoria-retencion/retencion/*`, `apps/api/src/integracion/notificador/*`, `cotizacion.service.ts` (detalle por enlace), `apps/api/test/seguimiento.e2e-spec.ts`, `apps/web/src/pages/{panel-asesor/ColaSeguimiento.tsx,retomar}`.
- **Decisiones**: sin nuevas (aplica D-12, D-29, D-34, D-37).
- **Pruebas**: api 229 · web 27. Cubren RF-16…RF-21, RN-10, RN-11, RN-12, RN-27 (TELEMARKETING), RNF-11, D-12, D-29, D-34.
- **Para defender**:
  1. *Reglas de tiempo con Reloj* (`retencion/dominio/seguimiento.ts`): «¿cómo prueban los 7 días?» → Reloj fijo que se adelanta; 410 al día 8.
  2. *Un solo mensaje final* (`retencion.service.ts`, `avisar`): «¿y si el asesor cierra dos veces?» → 409; lo enviado queda en la bitácora de actividad.
- **Siguiente paso**: cerrar F6 y empezar F7 (administración).

## 2026-11-04 21:19 (Lima) · F5 · Asesoría y descuento (CU-03)
- **Qué se hizo**: F4 mergeada (PR #5). `DerivadorCasosAsesoria` reemplaza al temporal (crea la solicitud SISTEMA). `AsesoriaService`: solicitar (con asociación de la cotización), cola RN-13, detalle, tomar, prima manual (D-32), descuento ≤ máximo, resultado (ACEPTA habilita la compra; NO_ACEPTA/NO_RESPONDE → seguimiento). El comparativo habilita «Comprar ahora» tras una asesoría aceptada. Web: selección de canal y panel del asesor. Verificado en el navegador: taxi primero en la cola, detalle a 360 px.
- **Errores encontrados y resueltos**: el orden de los planes en el comparativo no era determinista (fallaba la prueba RN-16 solo en la suite completa) → `orderBy` aseguradora + plan.
- **Archivos tocados**: `apps/api/src/asesoria-retencion/{asesoria,asesoria-retencion.module.ts,retencion/seguimiento-apertura.ts}`, `cotizacion/{cotizacion.module,cotizacion.service}.ts`, `apps/api/test/asesoria.e2e-spec.ts`, `apps/web/src/pages/{seleccion-canal,panel-asesor}`.
- **Decisiones**: sin nuevas (aplica D-30, D-31, D-32).
- **Pruebas**: api 184 · web 23. Cubren RF-06, RF-11…RF-15, RN-07, RN-13, RN-27 (ASESORIA), D-30, D-32.
- **Para defender**:
  1. *Puerto implementado por otro módulo* (`asesoria-retencion.module.ts`): «¿hay ciclo entre cotización y asesoría?» → No; asesoría implementa la interfaz de cotización.
  2. *Doble barrera del descuento* (`descuentos.ts` + trigger T2): «¿y si alguien inserta 12 % por SQL?» → La BD lo rechaza.
- **Siguiente paso**: cerrar F5 y empezar F6 (seguimiento).

## 2026-11-04 21:15 (Lima) · F4 · Compra autónoma, pagos y pólizas (CU-02) + auditoría
- **Qué se hizo**: F3 mergeada (PR #4). Dominio: descuentos (RN-07/08/09), `atribuirCanal` (RN-27), habilitación de compra, cronograma de cuotas. Puertos simulados: pasarela, emisor, PDF (pdfkit con marca de agua) y `SimuladorFallos`. `CompraService`: orden editable (D-28), datos faltantes y primera compra, confirmación con firma y cronograma, pago → transacción (pago + cuotas + emisión + póliza + PDF + estados) con rollback y anulación del cobro. Pólizas: descarga con propiedad (regenera las históricas) y «mis trámites». Web: compra paso a paso, mis trámites. Flujo completo verificado en el navegador a 360 px. **Auditor** (subagente, solo lectura): 0 bloquea · 8 corregir · 13 menores. Corregidos los 8 y 11 menores: el guard verifica `activo`, 404/400 en usuarios, `habilitadaPorAsesoria` como regla única del mismo plan, anulación del cobro ante cualquier falla, precio recalculado en la transacción, PDF desde las cuotas guardadas, antigüedad 0 para el año siguiente, reloj fijo en e2e, tests con literales de 02 §10 y RN-06/15/16/23/24/26.
- **Errores encontrados y resueltos**: pdfkit + zlib abortaba Node dentro de Jest (→ `compress: false`); el pie del PDF bajo el margen generaba páginas sin fin (→ margen 0 al escribir el pie); el resumen pagado mostraba «Sin descuento» (la póliza propia contaba como previa).
- **Archivos tocados**: `apps/api/src/{compra,pagos,polizas,integracion}/*`, `seguridad/autenticacion.guard.ts`, `administracion/usuarios.controller.ts`, `apps/api/test/{compra,cotizacion,seguridad}.e2e-spec.ts`, `apps/web/src/pages/{pago-poliza,mis-tramites}`.
- **Decisiones**: D-48, D-49, D-50.
- **Pruebas**: api 148 (en git) · web 19. Cubren RF-09, RF-20, RF-22…RF-26, RN-06…RN-09, RN-14, RN-15, RN-16, RN-23, RN-24, RN-26, RN-27, RNF-05, D-08, D-30.
- **Para defender**:
  1. *Transacción y rollback* (`compra/compra.service.ts`, `pagar`): «¿qué pasa si la aseguradora falla después de cobrar?» → Se revierte todo y se anula el cobro; hay prueba.
  2. *No acumulación de descuentos* (`compra/dominio/descuentos.ts`): «5 % + 8 %, ¿cuánto?» → 8 % (RN-09), con tope del máximo.
  3. *Auditoría independiente* (subagente `auditor`): «¿cómo controlan la calidad?» → Un revisor de solo lectura contrasta código y especificación; se corrigieron sus hallazgos antes de mergear.
- **Siguiente paso**: cerrar F4 y crear F5 con el trabajo adelantado.

## 2026-11-04 20:55 (Lima) · F3 · Cotizar y comparar (CU-01)
- **Qué se hizo**: F2 mergeada (PR #3). Dominio puro: 5 estrategias + `primaDePrueba`, `calcularOpciones`, `evaluarNicho`, `unirCampos`/`validarContraCatalogo`, `redondear2`. Servicios: catálogo (formulario, inspección), registro único, `CotizacionService` (una transacción + derivación por puerto). Endpoints `GET /api/catalogo/formulario`, `POST/GET /api/cotizaciones`. Web: cotizador dinámico, comparativo ordenable con Opción 1/2 por plan, pantallas base de compra y asesoría. Los 5 casos de demo se verificaron en el navegador a 360 px.
- **Archivos tocados**: `apps/api/src/{cotizacion,dominio-compartido,comun/dinero.ts}`, `apps/api/test/cotizacion.e2e-spec.ts`, `apps/web/src/pages/{cotizador,seleccion-canal,pago-poliza}`, `apps/web/src/{tipos,componentes/formato.ts}`.
- **Decisiones**: D-46, D-47.
- **Pruebas**: api 74/74, web 12/12. Cubren RF-01…RF-08, RF-10, RN-01…RN-05, RN-17…RN-26, RF-32 (cotización).
- **Para defender**:
  1. *Strategy* (`cotizacion/estrategia/estrategias.ts`): «¿qué cambia si entra HDI?» → Una clase nueva y una fila en `aseguradora`; el servicio no se toca.
  2. *Reglas puras* (`cotizacion/dominio/calcular-opciones.ts`): «¿por qué el taxi no puede comprar en línea?» → La regla de inspección (aseguradora × uso) bloquea la Opción 1; 6 pruebas sin BD.
  3. *Inversión de dependencias* (`cotizacion/derivador-casos.ts`): «¿cotización importa asesoría?» → No; depende de una interfaz.
- **Siguiente paso**: cerrar F3 y empezar F4 (compra).

## 2026-11-04 20:47 (Lima) · F2 · Seguridad
- **Qué se hizo**: F1 mergeada (PR #2, CI verde). Módulo `seguridad` (registro, login, `yo`, JWT con expiración, guard global de autenticación + rol, `verificarPropiedad`), `administracion/usuarios` (crear asesores, activar/desactivar), Reloj y RegistroActividad en `comun` (adelantado de F3 porque la actividad necesita la fecha), validación por campo con zod. Web: router, contexto de sesión, login/registro, rutas protegidas, menú por rol, pantallas base de mis-trámites/asesor/admin.
- **Archivos tocados**: `apps/api/src/{seguridad,administracion,comun}/*`, `apps/api/test/{seguridad,permisos}.e2e-spec.ts`, `apps/api/test/soporte/*`, `apps/web/src/{api,sesion,componentes,pages,test}/*`.
- **Decisiones**: sin decisiones nuevas de negocio; el Reloj se creó en F2 (D-38 decía F3).
- **Pruebas**: api 41/41, web 6/6. Cubren RF-31, RF-32, RNF-09, RNF-10, RF-11 (registro), D-36, D-07.
- **Para defender**:
  1. *Guard global + `@Roles`* (`seguridad/autenticacion.guard.ts`): «¿qué pasa si alguien llama a la API sin pasar por la web?» → La API responde 401/403; la UI no es la barrera.
  2. *Tabla endpoints × roles* (`test/soporte/endpoints.ts`): «¿cómo prueban el 100 % de RNF-10?» → Cada endpoint protegido nuevo se agrega a la tabla y la prueba lo recorre con los 3 roles y sin token.
- **Siguiente paso**: cerrar F2 y empezar F3 (cotización).

## 2026-11-04 20:41 (Lima) · F1 · Modelo de datos, restricciones y seed
- **Qué se hizo**: F0 mergeada (PR #1, CI verde en ubuntu y windows). Esquema Prisma con 22 tablas, 16 enums y 25 FK (verificado en el SQL). Migración de restricciones: CHECK, índice parcial, T1–T6 y RLS. PrismaService con adapter pg. Seed completo con historial de 80 pólizas. Jest de la api con BD de pruebas.
- **Archivos tocados**: `apps/api/prisma/{schema.prisma,seed.ts,migrations/*}`, `apps/api/prisma.config.ts`, `apps/api/src/persistencia/*`, `apps/api/jest.config.js`, `apps/api/test/soporte/*`, `apps/api/test/restricciones-bd.e2e-spec.ts`, `eslint.config.mjs`.
- **Decisiones**: D-44 (migrate reset bloqueado para agentes → deploy + seed), D-45 (6 reglas de trigger, 8 CREATE TRIGGER).
- **Pruebas**: 11/11. Cubren a nivel BD: RN-07 (T2), RN-10 (T6), RN-11 (CHECK), RN-14 (T3), FK compuesta, índice parcial, T1, T5, seed.
- **Para defender**:
  1. *FK compuesta* (`schema.prisma`, modelo OrdenCompra): «¿cómo evitan comprar con la prima de otra cotización?» → La BD lo rechaza; hay test.
  2. *Triggers como última barrera* (`*_restricciones/migration.sql`): «¿por qué validar dos veces?» → El dominio da el mensaje; la BD protege de bugs y de consultas manuales.
  3. *Seed como única fuente de los valores iniciales* (`seed.ts:7-14`): «¿dónde está el 5 %?» → En el seed y luego en `parametros_comerciales`.
- **Siguiente paso**: cerrar F1 y empezar F2 (seguridad).

## 2026-11-04 20:34 (Lima) · F0 · Esqueleto del monorepo terminado
- **Qué se hizo**: decisiones D-11…D-24 tomadas y D-25…D-43 registradas; 02 §6 corregido (canal definitivo en la transacción de pago). Monorepo npm workspaces (NestJS 11 + React 19/Vite 8/Tailwind 4), `GET /api/salud`, inicio con aviso de simulación, ESLint + Prettier, CI ubuntu/windows, README para PowerShell.
- **Archivos tocados**: `package.json`, `eslint.config.mjs`, `apps/api/**` (main, app, app.module, comun/salud, prisma), `apps/web/**` (App, AvisoSimulacion, Inicio, vite/jest config), `.github/workflows/ci.yml`, `README.md`, `docs/04-decisiones.md`, `docs/02-especificacion.md`, `docs/MAPA.md`, `docs/trazabilidad.md`, `docs/sustentacion.md`.
- **Decisiones**: D-25 (versiones), D-42 (CI dos jobs), D-28 (02 §6). Arreglo técnico: sin `incremental` en el tsconfig de la api.
- **Pruebas**: 2/2 (salud e2e, aviso de simulación). Todavía no cubren RN.
- **Para defender**:
  1. *Un proceso, una URL* (`apps/api/src/app.module.ts`): «¿cómo se comunica la web con la API?» → En desarrollo Vite reenvía `/api` a Nest; en la demo Nest sirve el build de React.
  2. *Configuración común para pruebas* (`apps/api/src/app.ts`): «¿sus pruebas prueban lo mismo que se despliega?» → Sí: `configurarApp()` la usan `main.ts` y los tests.
- **Siguiente paso**: cerrar F0 (PR + CI + merge) y empezar F1.

## 2026-11-04 20:15 (Lima) · F0 · Sistema de memoria y skills
- **Qué se hizo**: lectura de CLAUDE.md y docs/01–04; detección de N1–N19 (contradicciones y huecos nuevos); respuestas de Denis a D-11, D-21, D-22, D-23 y D-24; plan de F0 aprobado con ajustes (N8 aprobado, caso mixto → TELEMARKETING, canal definitivo en la transacción de pago). Se montó la memoria en el repo (este archivo, ESTADO, MAPA, COMO_CAMBIAR, trazabilidad, sustentacion), las skills `retomar`, `checkpoint`, `cerrar-fase`, `cambio`, `demo`, el subagente `auditor` y el hook SessionStart. Rama `feat/f0-arranque` creada desde `main`. Postgres 16 del contenedor levantado con las bases `svas` y `svas_test`.
- **Archivos tocados**: `CLAUDE.md`, `.gitattributes`, `.claude/settings.json`, `.claude/hooks/session-start.sh`, `.claude/skills/*/SKILL.md`, `.claude/agents/auditor.md`, `docs/ESTADO.md`, `docs/BITACORA.md`, `docs/MAPA.md`, `docs/COMO_CAMBIAR.md`, `docs/trazabilidad.md`, `docs/sustentacion.md`.
- **Decisiones**: D-11 jsonb, D-21 local + Railway, D-22 Postgres en Windows, D-23 ramas feat/fN con PR, D-24 sin DDL. N1–N19 aprobadas. **Aún sin registrar en `04-decisiones.md`**: es el siguiente paso.
- **Pruebas**: 0 (todavía no hay código ni `package.json`).
- **Para defender**:
  1. *Gestión de configuración*: rama por fase + PR + CI antes de mergear a `main` (archivo `.claude/skills/cerrar-fase/SKILL.md`). Pregunta probable del jurado: «¿Cómo garantizan que `main` siempre funciona?» → Solo se mergea con el CI en verde en Ubuntu y Windows.
  2. *Trazabilidad*: cada RF/RN apunta a un archivo y un test (`docs/trazabilidad.md`). Pregunta probable: «¿Dónde está implementada RN-09?» → En la tabla, con su test.
- **Siguiente paso**: F0 paso 1, registrar decisiones en `docs/04-decisiones.md` y corregir `docs/02-especificacion.md` §6 (canal definitivo en la transacción de pago).
