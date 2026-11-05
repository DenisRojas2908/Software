# Bitácora del proyecto SVAS

Solo se agrega; la entrada más reciente va arriba. Formato por checkpoint: fecha y hora (Lima) · fase · qué se hizo · archivos tocados · decisiones · pruebas · «Para defender» · siguiente paso.

---

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
