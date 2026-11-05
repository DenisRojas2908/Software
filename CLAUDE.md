# SVAS — Simulación del Sistema de Venta Autónoma de Seguros

Proyecto integrador del curso **Ingeniería de Software (SI707V, UNI-FIIS, 2026-2), Grupo 4**.
Construimos una **simulación funcional** de un bróker digital de seguros vehiculares (inspirado en el proceso real de SeguroSimple.com, Perú): el cliente cotiza en 5 aseguradoras y puede **comprar sin la llamada obligatoria de un asesor** (Opción 1) o **pedir asesoría/descuento** (Opción 2). Las cotizaciones no concretadas pasan a una **cola de seguimiento (telemarketing)**.

El sistema se presenta **una sola vez** (sustentación final) y no se mantiene después. Prioridades, en orden:
1. Que los 5 casos de uso (CU-01…CU-05) funcionen de punta a punta en la demo.
2. Que el código **coincida con lo ya entregado** (análisis PC1 y diseño PC2): nombres, módulos, reglas, tablas. El profesor va a contrastar.
3. Que cualquier integrante pueda **explicar** cada módulo (la sustentación pesa 50 % de la nota).
4. Lo mínimo de infraestructura. Nada de complejidad que no se vea en la demo.

## Fuente de verdad (en este orden)
1. `docs/02-especificacion.md` — requisitos, reglas, modelo de datos y tarifas de prueba, condensados.
2. `docs/04-decisiones.md` — decisiones ya tomadas para la simulación y las pendientes.
3. `docs/03-plan.md` — fases, tareas y criterios de aceptación.
4. `docs/01-analisis.md` — contexto, alcance, inconsistencias detectadas y riesgos.
5. `docs/fuentes/` — texto completo de los entregables (PC1 análisis, PC2 diseño, ficha). Úsalo para detalles. Si contradice a 1–2, mandan 1–2 (los entregables tienen deriva de stack: PC1 dice Spring Boot; lo vigente es NestJS).

Si algo no está en ninguno: **no lo inventes en silencio**. Pregunta, o implementa la opción más simple y regístrala en `docs/04-decisiones.md` como *Propuesta* y avísame al cerrar la fase.

## Stack (fijo)
- Monorepo con npm workspaces: `apps/api` (NestJS + TypeScript) y `apps/web` (React + TypeScript + Vite).
- PostgreSQL (Supabase en la nube; Postgres local opcional para desarrollo). ORM: **Prisma con conexión directa a Postgres** (necesitamos transacciones reales, RNF-05; el cliente supabase-js no las da).
- Autenticación: JWT con expiración + bcrypt. Control de rol y de propiedad **en el backend**.
- PDF: pdfkit (o equivalente ligero) en el backend.
- Pruebas: Jest + Supertest en `api`; Jest + Testing Library en `web`.
- UI: Tailwind, mobile-first (correcto desde 360 px). Formularios: react-hook-form + zod. Gráficos de reportes: Recharts. Datos remotos: TanStack Query.
- **No agregues**: microservicios, colas o brokers, Redis, GraphQL, Kubernetes, Docker para el despliegue, ni librerías que no resuelvan un requisito concreto.

## Arquitectura: monolito modular (tal como el diagrama de paquetes de PC2)
Un solo backend desplegable. En la demo/producción NestJS sirve también el build de la SPA → **un proceso, una URL**. En desarrollo, Vite con proxy `/api` → Nest.

`apps/api/src`:
```
seguridad/            login/registro, JWT, guards de rol y de propiedad (RF-31, RF-32, RNF-10)
comun/                RegistroActividad, manejo de errores, Reloj (puerto), config
dominio-compartido/   catalogo/ (Aseguradora, Plan, CampoRequerido, ReglaInspeccion, ParametrosComerciales)
                      cliente/  (Cliente, Vehiculo, UbicacionUso — registro único)
cotizacion/           CotizacionService, reglas de derivación, puerto DerivadorCasos
  estrategia/         EstrategiaCotizacion + EstrategiaRimac, Pacifico, LaPositiva, Mapfre, Qualitas
compra/               Opción 1: OrdenCompra, firma simulada, resolución de descuentos
asesoria-retencion/   asesoria/  (SolicitudAsesoria, cola priorizada, descuento negociado)
                      retencion/ (Seguimiento, IntentoContacto, enlace de retoma)
pagos/                Pago, Cuota
polizas/              emisión, PDF, canal de venta, consulta de estado
administracion/       catálogo, parámetros, usuarios, reportes
integracion/          puertos + implementaciones simuladas: pasarela/, aseguradora/, pdf/, notificador/
persistencia/         PrismaService
demo/                 herramientas de simulación (solo con DEMO_MODE=true)
```
`apps/web/src/pages`: `cotizador`, `seleccion-canal`, `pago-poliza`, `panel-asesor`, `panel-admin` (son los 5 paquetes de presentación del diseño) + `login`, `mis-tramites`, `retomar/:token`, `demo`.

### Reglas de dependencia (se defienden en la sustentación; no las rompas)
- **Sin ciclos entre módulos.** `cotizacion` NO importa `asesoria-retencion`: define el puerto `DerivadorCasos` y `asesoria` lo implementa (inyección por token de Nest). Inversión de dependencias.
- **Patrón Strategy**: `CotizacionService` recorre las estrategias sin saber de qué aseguradora es cada una. Agregar una aseguradora = nueva clase + registro en catálogo, sin tocar el servicio (abierto/cerrado).
- **Las reglas viven en el dominio**: funciones/clases puras, testeables sin BD (`calcularOpciones()`, `resolverDescuento()`, `Seguimiento.puedeContactar()`, `Seguimiento.cerrar()`, `atribuirCanal()`). Los services solo orquestan.
- **Lo externo siempre detrás de una interfaz** con implementación simulada: pasarela de pago, emisión de la aseguradora, generador de PDF, notificador (WhatsApp/llamada/mensaje final). RNF-15, RN-26.
- **Configuración de negocio desde BD** (ParametrosComerciales, CampoRequerido, ReglaInspeccion): nada de 5 %, 10 %, 4 intentos o 7 días escritos en el código (RNF-13). Esos valores solo viven en el seed.
- **Transacciones**: pago + emisión + póliza + cambios de estado en UNA transacción; si falla la emisión se revierte todo (RNF-05). Cada cambio de catálogo/parámetros + su RegistroActividad en la misma transacción.
- **Seguridad**: un CLIENTE solo ve sus cotizaciones, órdenes y pólizas; ASESOR y ADMINISTRADOR solo sus vistas. Ocultar botones en la UI no cuenta.

## Convenciones
- **Idioma del dominio: español, igual que los diagramas** (`Cotizacion`, `PrimaCotizada`, `EstrategiaCotizacion`, `DerivadorCasos`, `ParametrosComerciales`, `canalVenta`…). Sin tildes ni ñ en identificadores (`anio`). Lo técnico genérico puede ir en inglés (`main.ts`, `app.module.ts`).
- Enums con los valores **exactos** de la especificación (`COMPRA_INMEDIATA`, `NO_CONCRETADA`, `TELEMARKETING`…).
- Comentarios en español, cortos, citando el ID: `// RN-09: no se acumulan; se aplica el mayor`. Nombres de tests con el ID: `it('RN-07: rechaza un descuento mayor al máximo')`.
- Toda la UI muestra un aviso discreto de **simulación académica**; todo PDF lleva **"Documento de demostración sin validez legal"** (RNF-20).
- Marca de la interfaz: **"SVAS"**. No copiar logo, colores ni textos de SeguroSimple.com, ni logos de aseguradoras (solo sus nombres en texto).
- **Nunca pedir número de tarjeta, CVV ni datos bancarios.** El pago simulado es un botón (con un control de demo para forzar rechazo). DNI y personas del seed son ficticios.
- Entorno del dueño: **Windows (PowerShell)**. Scripts npm multiplataforma (`cross-env`, `rimraf`, nada de `rm -rf` ni `&&` dependientes de bash en scripts), `.gitattributes` con `* text=auto eol=lf`.
- Secretos solo en `.env` (no versionado). Mantener `.env.example` al día.

## Forma de trabajo
- Trabaja **por fases** de `docs/03-plan.md`, en orden. Al iniciar una fase: plan corto (usa modo plan). Al terminarla: **para** y reporta en ≤10 líneas qué quedó, cómo probarlo (comando, URL, usuario), estado de los tests y pendientes. Espera mi "sigue".
- **Git**: rama por fase `feat/fN-nombre`; commits pequeños en español con prefijo convencional y el CU (`feat(cotizacion): CU-01 comparativo con opciones habilitadas`). Merge a `main` al cerrar la fase con tests en verde. Esto es parte de la competencia "gestión de configuración" del curso.
- **Definición de terminado de una fase**: (1) criterios de aceptación cumplidos; (2) `npm test` en verde; (3) `npm run dev` levanta todo; (4) el seed permite demostrar la fase; (5) `docs/trazabilidad.md` y `docs/sustentacion.md` actualizados.
- `docs/trazabilidad.md`: tabla RF / RN / CU → archivo(s) → test(s).
- `docs/sustentacion.md`: por módulo, 5–8 líneas en lenguaje simple: qué hace, dónde está la regla, qué patrón o principio aplica, y 1–2 preguntas probables del profesor con su respuesta.
- Ante dos opciones equivalentes, elige la que **menos código** añade. Simple y que funcione en la demo > "enterprise".
- No edites `docs/02-especificacion.md` por tu cuenta: si encuentras un hueco, regístralo en `docs/04-decisiones.md` y avísame.

## Comandos (los crea la fase 0; mantén esta sección actualizada)
`npm install` · `npm run dev` · `npm test` · `npm run db:migrate` · `npm run db:seed` · `npm run db:reset` · `npm run build` · `npm start`

## Usuarios demo (seed)
- `admin@svas.demo` / `Admin123!` — ADMINISTRADOR
- `asesor1@svas.demo`, `asesor2@svas.demo` / `Asesor123!` — ASESOR
- `cliente@svas.demo` / `Cliente123!` — CLIENTE con una póliza previa (sirve para probar que NO aplica el descuento por primera compra)
