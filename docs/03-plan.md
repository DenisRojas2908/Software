# 03 · Plan de implementación por fases

Cada fase termina en algo que **se puede mostrar** y con tests en verde. Al cerrar una fase: merge a `main`, actualizar `trazabilidad.md` y `sustentacion.md`, y reportar (ver `CLAUDE.md`).

| Hito del curso | Fases que deben estar listas |
|---|---|
| **P3** (interfaces + codificación I) | F0, F1, F2, F3 y las **pantallas base** de los 5 paquetes de presentación (aunque algunas aún usen datos fijos) |
| **P4** (conectividad BD + prototipo) | F4, F5, F6, F7 |
| **P5** (pruebas, configuración, manuales) | F8, F9 |
| **EF** (sustentación) | F10 + ensayo con el guion de demo |

---

## F0 · Arranque del repositorio
- Monorepo npm workspaces: `apps/api` (NestJS), `apps/web` (Vite + React + TS), `package.json` raíz con scripts `dev` (ambos en paralelo), `test`, `build`, `start`, `db:*`.
- Tailwind en web; proxy de Vite `/api` → `http://localhost:3000`. En build, Nest sirve `apps/web/dist` (ServeStaticModule, excluyendo `/api`) → un solo proceso.
- Prisma inicializado; `DATABASE_URL` (+ `DIRECT_URL` si se usa el pooler de Supabase) en `.env`; `.env.example`.
- ESLint + Prettier mínimos; `.gitignore`, `.gitattributes` (eol=lf); `README.md` corto (cómo levantar).
- GitHub Actions: en cada PR y push a `main`, `npm ci && npm test` (con un Postgres de servicio para los tests de integración).
- `GET /api/salud` devuelve ok; la web muestra la pantalla de inicio "SVAS — simulación académica".
- **Acepta si**: en Windows, `npm install` + `npm run dev` levanta web y api; `npm test` corre (aunque sea un test); el workflow pasa en GitHub.

## F1 · Modelo de datos, restricciones y seed
- `schema.prisma` con las 22 tablas y 16 enums de `02-especificacion.md §9` (nombres de modelo en español; tablas en snake_case con `@@map`).
- Migración SQL adicional con: FK compuesta de `orden_compra`, índice único parcial de `pago`, CHECKs, los triggers (los 4 conocidos + los 2 del DDL de 3.5 si está en `docs/fuentes/`), y `ENABLE ROW LEVEL SECURITY` en todas las tablas.
- Seed completo de `§10`, incluido el historial sintético para reportes.
- Scripts `db:migrate`, `db:seed`, `db:reset`.
- **Acepta si**: `db:reset` deja la BD lista; una consulta rápida muestra 5 aseguradoras, 15 planes, campos y parámetros; tests de BD verifican que la FK compuesta, el índice parcial y el trigger de descuento máximo rechazan datos inválidos.

## F2 · Seguridad
- Registro mínimo (CLIENTE), login, `GET /api/auth/yo`; JWT con expiración; bcrypt.
- Guards: `@Roles(...)` y verificación de propiedad (un cliente solo accede a lo suyo).
- Admin crea usuarios ASESOR/ADMINISTRADOR (endpoint; la pantalla llega en F7).
- Web: login, contexto de sesión, rutas protegidas por rol, menú según rol.
- **Acepta si**: test parametrizado endpoints × roles (RNF-10) en verde; credenciales inválidas → 401; cliente A no ve la cotización de cliente B → 403/404.

## F3 · CU-01 Cotizar y comparar
- `GET /api/catalogo/formulario` (unión de campos de aseguradoras activas).
- `POST /api/cotizaciones`: validación por catálogo (errores por campo), nicho, registro único cliente/vehículo, estrategias, derivación (`§5`), `cotizacion_opcion`, puerto `DerivadorCasos` (implementación temporal que solo registra; la real llega en F5), RegistroActividad.
- 5 estrategias con las tarifas de prueba de `§10`, registradas por `codigo_estrategia` (registro de estrategias inyectado; nada de `switch` por aseguradora en el servicio).
- Web `cotizador` (formulario dinámico, mobile-first) y comparativo: tabla/tarjetas por aseguradora y plan, ordenables por precio; aseguradoras que no cotizaron indicadas; por plan, botones **"Comprar ahora"** (Opción 1, deshabilitado con explicación si no aplica) y **"Prefiero que me asesoren"** (Opción 2). Pantalla `seleccion-canal`.
- Pantallas base (vacías o con datos fijos) de `pago-poliza`, `panel-asesor`, `panel-admin` para presentar interfaces en P3.
- **Tests**: cada estrategia; `calcularOpciones()` con los casos RN-01…RN-05, RN-25; validación por catálogo; integración de `POST /api/cotizaciones` para auto 2022, 2009, 2003, taxi y camión.
- **Acepta si**: los 5 casos de demo de `§10` se ven bien en el navegador a 360 px.

## F4 · CU-02 Compra autónoma + pagos + pólizas
- Orden de compra, asociar cotización a la cuenta (registro/login sin perder la cotización), datos faltantes, evaluación de primera compra, condiciones + firma simulada, cronograma de cuotas antes de confirmar.
- Puertos `PasarelaPago`, `EmisorAseguradora`, `GeneradorPdf`, cada uno con implementación simulada; `GeneradorPdf` con pdfkit y marca de agua de demostración; archivo en `storage/polizas/` (ruta en `archivo_pdf`).
- `POST /api/compras/:id/pagar`: **una transacción** para pago, cuotas, emisión, póliza, canal (RN-27), estados de cotización y seguimiento.
- Web `pago-poliza`: resumen → identificarse → datos faltantes → condiciones y modo de pago → pagar → confirmación con descarga; `mis-tramites` (RF-26).
- **Tests**: `resolverDescuento()` (RN-07/08/09), `atribuirCanal()` (RN-27), integración de compra completa, pago rechazado (no emite) y emisión fallida (rollback: no queda pago confirmado ni póliza).
- **Acepta si**: un invitado cotiza, se registra, compra en cuotas y descarga el PDF sin hablar con nadie; `cliente@svas.demo` no recibe el 5 %.

## F5 · CU-03 Asesoría / descuento
- `DerivadorCasos` real en `asesoria` (la cotización ya no usa la implementación temporal); solicitud del cliente con motivo y canal.
- Cola priorizada (RN-13), tomar caso, registrar prima manual en casos NO_ASEGURABLE/INSPECCION, descuento ≤ máximo, resultado; si acepta → la compra queda habilitada con prima negociada (canal ASESORIA); si no → NO_CONCRETADA + seguimiento.
- Web `panel-asesor` (pestaña Asesoría): cola con badges de motivo/origen, detalle sin re-digitación, acciones.
- **Tests**: orden de la cola, tope de descuento (dominio y trigger), flujo completo solicitud → descuento → compra ASESORIA.
- **Acepta si**: el taxi de la demo aparece primero en la cola (derivado), y una solicitud de cliente termina en póliza con canal ASESORIA.

## F6 · CU-04 Seguimiento de telemarketing
- Job de abandono (`§7`) + botón de demo; `Seguimiento` con `puedeContactar()` y `cerrar()` en dominio; intentos solo por canal preferido; cierre automático al agotar intentos/días.
- Enlace de retoma (token aleatorio, expira en `vigenciaEnlaceDias`); `GET /api/retoma/:token` lleva a la compra con el descuento; compra desde enlace → TELEMARKETING.
- Puerto `Notificador` con implementación simulada (registra el mensaje; visible en el buzón de demo); un solo mensaje final; reenviar si falló.
- Puerto `Reloj` (sistema / simulado) usado en todas las reglas de tiempo.
- Web `panel-asesor` (pestaña Seguimiento) y página `retomar/:token` (válido / vencido).
- **Tests**: `puedeContactar()` (intentos y días, con reloj simulado), cierre exige motivo, un solo mensaje final, enlace vencido, atribución TELEMARKETING.
- **Acepta si**: se demuestra el ciclo completo y, adelantando el reloj 8 días, el enlace aparece vencido.

## F7 · CU-05 Catálogo, parámetros, usuarios y reportes
- CRUD con "desactivar, no borrar": aseguradoras, planes, campos requeridos y valores permitidos, reglas de inspección, parámetros comerciales, usuarios.
- Cada cambio + `RegistroActividad` en la misma transacción; vista de actividad reciente.
- Reportes por canal, aseguradora y plan con rango de fechas (Recharts + tabla).
- **Tests**: desactivar una aseguradora la saca del formulario y del comparativo, pero sus cotizaciones antiguas siguen consultables; cambiar el máximo de descuento cambia lo que acepta el asesor; un ASESOR no puede tocar `/api/admin/*`.
- **Acepta si**: en vivo, el admin vuelve obligatorio un campo o desactiva una aseguradora y el cotizador cambia **sin reiniciar ni tocar código** (es la demostración de RNF-13).

## F8 · Modo simulación y guion de demo
- `DEMO_MODE=true` habilita la página `demo` (solo ADMINISTRADOR): adelantar reloj, forzar pago rechazado / emisión fallida / aseguradora caída, procesar abandonos, buzón de mensajes simulados, reset de la BD.
- `docs/guion-demo.md` (ver abajo) probado de punta a punta.
- **Acepta si**: el guion completo se ejecuta en < 15 minutos sin tocar la BD a mano.

## F9 · Pruebas, calidad y documentación de P5
- Completar tests de RNF-16; reporte de cobertura (meta ≥ 70 % en dominio); tests de web para formulario dinámico y botones de opciones.
- (Opcional) prueba de carga corta del comparativo (p. ej. autocannon) y anotar el p95 obtenido en `sustentacion.md`.
- `docs/manual-usuario.md` (cliente y asesor) y `docs/manual-administrador.md`, con capturas.
- **Acepta si**: `npm test` en verde en local y en GitHub Actions; manuales listos.

## F10 · Despliegue (si se exige URL pública) y cierre
- Opción por defecto: **un solo servicio** (Railway) con `npm run build && npm start` + BD en Supabase (pooler en modo sesión). Alternativa fiel a 4.1: web en Vercel + api en Railway (CORS y `VITE_API_URL` por variable).
- Checklist del día: BD despierta, seed de demo aplicado, usuarios probados, plan B local.
- **Acepta si**: la URL abre en el celular y el guion funciona contra ella; existe plan B local.

---

## Guion de demo (base para `docs/guion-demo.md`)
1. **Admin** muestra catálogo, parámetros y reportes con historial (CU-05).
2. **Cliente invitado**, auto particular 2022 → comparativo de 5 aseguradoras → "Comprar ahora" → se registra → DNI nuevo: **5 % primera compra** → 6 cuotas → paga → **PDF** (CU-01, CU-02; canal AUTONOMO).
3. Auto 2009 → dos aseguradoras "no cotizan" (4a). Auto 2003 → **no asegurable**, derivado sin pedir correo (3a). Camión → **fuera de nicho** (3b).
4. **Taxi** → solo Opción 2; aparece **primero** en la cola del asesor (RN-13).
5. Cliente pide "prefiero que me asesoren" (NEGOCIACION) → asesor ofrece 8 % (intenta 12 % y el sistema lo rechaza) → cliente acepta → compra con canal **ASESORIA** (CU-03).
6. Cotización abandonada → "procesar abandonos" → cola de seguimiento → 2 intentos por WhatsApp → cierre "PRECIO" → mensaje final en el buzón → el cliente usa el enlace → compra con canal **TELEMARKETING** (CU-04).
7. Otra cotización: 4 intentos → bloqueo del 5.º; adelantar reloj 8 días → enlace **vencido**.
8. Fallos: pago rechazado (no emite) y emisión fallida (rollback).
9. Admin desactiva Quálitas y vuelve obligatorio un campo → el cotizador cambia en vivo; reportes reflejan los 3 canales de la demo (CU-05).
10. Intento de entrar a `/admin` como asesor → bloqueado (RF-32).
