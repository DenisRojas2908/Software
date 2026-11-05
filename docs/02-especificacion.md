# 02 · Especificación condensada para construir el SVAS

Fuente: Práctica 1 (análisis) y Práctica 2 (diseño) del Grupo 4. Lo marcado **[Propuesta]** no está en los entregables: lo define este documento para poder construir, y está justificado en `04-decisiones.md`.

## 1. Actores y roles
| Actor | Tipo | Rol en el sistema |
|---|---|---|
| Cliente | Interno | Cotiza sin cuenta; compra (Opción 1) o pide asesoría (Opción 2); paga; descarga la póliza; consulta estados. Necesita cuenta (registro mínimo) para comprar o pedir asesoría. |
| Asesor (incluye telemarketing) | Interno | Atiende la cola de asesoría y la cola de seguimiento. No hay rol "telemarketing" aparte. |
| Administrador | Interno | Catálogo, parámetros, usuarios, reportes. Crea las cuentas de asesor. |
| Aseguradoras (5) | Externo, simulado | Cotizan (estrategias con tarifas de prueba) y emiten (número de póliza de prueba). |
| Pasarela de pago | Externo, simulado | Recibe monto y modo; confirma o rechaza. |

Roles del sistema: `CLIENTE`, `ASESOR`, `ADMINISTRADOR`.

## 2. Requisitos funcionales (RF-01 … RF-33)
Prioridad 5 = máxima.
| ID | Módulo | Requisito | P |
|---|---|---|---|
| RF-01 | Cotizador | Ingresar vehículo (uso, marca, modelo, año, ubicación, clase y tipo) y contacto, y elegir canal preferido (LLAMADA / WHATSAPP) | 5 |
| RF-02 | Cotizador | Formulario dinámico = unión de los campos requeridos de las aseguradoras activas (catálogo) | 4 |
| RF-03 | Cotizador | Backend valida contra el catálogo (obligatoriedad, tipo, valores permitidos) y devuelve errores **por campo** | 4 |
| RF-04 | Cotizador | Prima por aseguradora vía `EstrategiaCotizacion` (una implementación por aseguradora, tarifas de prueba) | 5 |
| RF-05 | Cotizador | Comparativo de planes y primas; si una aseguradora no cotiza, las demás se muestran igual | 5 |
| RF-06 | Cotizador | No asegurable en línea → derivación automática a la cola de asesoría con los datos ya capturados, sin pedir correo | 4 |
| RF-07 | Cotizador | Registrar cada cotización en un registro único de cliente y vehículo, con canal preferido, estado y fecha | 4 |
| RF-08 | Flujo dual | Mostrar en cada plan Opción 1 y Opción 2 según reglas de derivación (RN-01…RN-04) | 5 |
| RF-09 | Flujo dual | Opción 1: elegir plan, completar solo datos faltantes, confirmar sin asesor | 5 |
| RF-10 | Flujo dual | Bloquear Opción 1 si la aseguradora exige inspección/evaluación (RN-03, RN-25) | 4 |
| RF-11 | Asesoría | Solicitar asesoría/descuento con motivo (DUDA, NEGOCIACION, DESCUENTO) y canal; registro mínimo si no tiene cuenta | 4 |
| RF-12 | Asesoría | Registrar la solicitud en la cola con estado PENDIENTE y mostrar confirmación con tiempo estimado de contacto | 4 |
| RF-13 | Asesoría | El asesor ve la cola con datos capturados y motivo | 4 |
| RF-14 | Asesoría | Descuento solo dentro del máximo; registrar asesor, fecha, aseguradora, plan y % | 3 |
| RF-15 | Asesoría | Registrar resultado; si acepta, habilitar la compra con la prima negociada | 3 |
| RF-16 | Retención | Cotización no concretada → cola de seguimiento con estado EN_SEGUIMIENTO | 4 |
| RF-17 | Retención | Registrar cada intento (canal, fecha, resultado); impedir superar el máximo; respetar canal preferido | 3 |
| RF-18 | Retención | Exigir motivo de no compra al cerrar | 3 |
| RF-19 | Retención | Estados de la cola: CONVERTIDO, EN_SEGUIMIENTO, DESCARTADO | 3 |
| RF-20 | Retención | Aplicar descuento por primera compra (RN-08) y registrarlo en la cotización | 3 |
| RF-21 | Retención | Al cerrar, enviar un mensaje con enlace de vigencia limitada para retomar la compra con el descuento | 2 |
| RF-22 | Emisión | Solicitar emisión vía componente con interfaz común → número de póliza de prueba | 5 |
| RF-23 | Pagos | Registrar pago único o en cuotas vía pasarela reemplazable con confirmación simulada | 5 |
| RF-24 | Emisión | Simular la firma, sin validez legal | 1 |
| RF-25 | Pólizas | PDF descargable al confirmarse el pago, sin re-pedir datos, marcado como demostración | 5 |
| RF-26 | Seguimiento | El cliente consulta el estado de su solicitud, pago y póliza | 3 |
| RF-27 | Administración | Activar/desactivar aseguradoras y planes sin tocar código | 3 |
| RF-28 | Administración | Mantener campos requeridos por aseguradora (nombre, tipo, obligatoriedad, valores permitidos) | 3 |
| RF-29 | Administración | Configurar descuento primera compra, máximo de negociación, máximo de intentos y exigencia de inspección por aseguradora y uso | 3 |
| RF-30 | Reportes | Ventas por canal (autónomo, asesoría, telemarketing), aseguradora y plan, por periodo | 3 |
| RF-31 | Seguridad | Autenticación y control por roles; el admin gestiona usuarios y roles | 5 |
| RF-32 | Seguridad | Impedir acceso a vistas/operaciones de otro rol | 4 |
| RF-33 | Postventa | **Backlog, no se implementa**: alerta de vencimiento | 1 |

## 3. Requisitos no funcionales que afectan al código
| ID | Exigencia | Cómo se cumple / verifica |
|---|---|---|
| RNF-01/02 | Comparativo ≤ 3 s (p95); otras operaciones ≤ 2 s | Estrategias en memoria; consultas con índices; (opcional) prueba de carga corta |
| RNF-05 | Compra atómica: o se completa o se revierte | `prisma.$transaction` en pago+emisión+póliza; test de emisión fallida |
| RNF-07 | Mobile-first, correcto desde 360 px | Tailwind; revisar cada pantalla a 360 px |
| RNF-08 | No volver a pedir datos ya capturados; errores por campo | Datos faltantes = campos de emisión − campos ya capturados |
| RNF-09 | Contraseñas con bcrypt; sesiones con expiración; HTTPS en el despliegue | JWT con `expiresIn`; bcrypt |
| RNF-10 | 100 % de endpoints protegidos rechazan otro rol | Test parametrizado que recorre endpoints × roles (en Jest, no JUnit) |
| RNF-11 | Datos personales solo para venta y seguimiento (Ley 29733); contacto por el canal elegido | Aviso en el formulario; el seguimiento solo permite el canal preferido |
| RNF-12 | Registrar acciones críticas con usuario y fecha | `RegistroActividad` en cotizaciones, descuentos, intentos, cambios de estado y de catálogo |
| RNF-13/14/15 | Agregar campo = configuración; aseguradora = estrategia + catálogo; módulos desacoplados; simulados reemplazables | Catálogo en BD, Strategy, puertos con DI |
| RNF-16 | Pruebas de cotización, autenticación, derivación; integración de compra, asesoría y retención; ≥ 70 % en dominio (meta) | Jest + Supertest; reporte de cobertura |
| RNF-18 | Frontend desacoplado vía API REST | SPA React consume `/api/*` |
| RNF-20 | PDF con "Documento de demostración sin validez legal" | Marca de agua + pie en todas las páginas |

## 4. Reglas de negocio (RN)
| ID | Regla | Valor inicial |
|---|---|---|
| RN-01 | Uso PARTICULAR con cotización estándar → Opción 1 habilitada; Opción 2 visible | — |
| RN-02 | COMERCIAL_LIGERO que la aseguradora cotiza en línea sin evaluación → Opción 1 con prima publicada; para negociar, Opción 2 | — |
| RN-03 | Uso que exige inspección (por defecto TRANSPORTE_PASAJEROS: taxi, colectivo, apps) → **solo Opción 2**, caso a la cola con motivo INSPECCION | — |
| RN-04 | No asegurable en línea → derivación automática a Opción 2, sin pedir correo; el asesor cotiza manualmente | — |
| RN-05 | Nicho: particular 1–2 vehículos por persona; comercial ligero 1–5. Flotas > 5, pesados y carga: se informa y **no** se genera cotización ni solicitud | — |
| RN-06 | La Opción 1 no admite negociación; la prima solo cambia por RN-08 o por descuento acordado y registrado (RN-07) | — |
| RN-07 | Descuento del asesor ≤ máximo fijado por el admin; queda registrado (asesor, fecha, plan, %) | 10 % |
| RN-08 | Descuento por primera compra, automático en la Opción 1 si el **número de documento** no tiene póliza previa; en seguimiento se ofrece vía enlace de retoma | 5 % |
| RN-09 | Primera compra y negociado **no se acumulan**: se aplica el mayor, sin pasar el máximo | — |
| RN-10 | Contacto de seguimiento solo por el canal preferido y sin pasar el máximo de intentos; al alcanzarlo, el caso se cierra | 4 intentos en 7 días |
| RN-11 | Todo cierre exige motivo (PRECIO, YA_CONTRATO, NO_RESPONDE, SIN_INTERES, OTRO) y estado final (CONVERTIDO o DESCARTADO) | — |
| RN-12 | Cierre sin conversión → **un solo** mensaje final con enlace para retomar con descuento; el enlace expira | 7 días |
| RN-13 | Cola de asesoría: primero los derivados por el sistema (RN-03, RN-04), luego los del cliente; dentro de cada grupo, por orden de llegada | — |
| RN-14 | Pago único o en cuotas; máximo de cuotas configurable | [Propuesta] 12 |
| RN-15 | PDF solo tras pago confirmado, con leyenda de demostración | — |
| RN-16 | Aseguradora o plan desactivado no aparece en nuevas cotizaciones; lo registrado se conserva (desactivar, no borrar) | — |
| RN-17 | Formulario = unión de campos requeridos de las aseguradoras activas | — |
| RN-18 | Rímac: marca, modelo, año | EstrategiaRimac |
| RN-19 | Pacífico: marca, modelo, año, ubicación | EstrategiaPacifico (recargo por ubicación) |
| RN-20 | La Positiva: marca, modelo, año, clase, tipo | EstrategiaLaPositiva (recargo por clase y tipo) |
| RN-21 | Mapfre: uso, marca, modelo, año, ubicación (formulario común) | EstrategiaMapfre |
| RN-22 | Quálitas: uso, marca, modelo, año, ubicación (formulario común) | EstrategiaQualitas |
| RN-23 | Aseguradora sin campo diferenciador → conjunto común (uso, marca, modelo, año, ubicación) | — |
| RN-24 | Mapfre admite Opción 1 y Opción 2 con RN-01…RN-04 | — |
| RN-25 | Inspección = parámetro por aseguradora y uso. Activo por defecto para TRANSPORTE_PASAJEROS (taxis, colectivos ≤ 5 unidades, apps tipo Uber) | — |
| RN-26 | En esta versión las estrategias devuelven tarifas y números de póliza de prueba | — |
| RN-27 | Canal de la venta: TELEMARKETING si la compra empezó desde el enlace de retoma o tras aceptar el descuento en seguimiento; ASESORIA si se compra con prima negociada en Opción 2; AUTONOMO en los demás casos | — |

## 5. Algoritmo de cotización y derivación (CU-01)
1. Validar entrada contra la unión de campos de aseguradoras activas (RF-03). Un campo es obligatorio si **alguna** aseguradora activa lo marca obligatorio. Errores por campo; no se pierde lo ingresado.
2. **Nicho (RN-05)** [Propuesta de detección]: fuera de nicho si `clase` ∈ {CAMION, BUS, REMOLCADOR} o si el cliente ya tiene registrados más vehículos de los permitidos para ese uso (PARTICULAR > 2, COMERCIAL_LIGERO > 5). Respuesta: mensaje, **sin** cotización ni solicitud.
3. Registro único (RF-07): reutilizar `Cliente` (por email o teléfono) y `Vehiculo` (mismo cliente + uso, marca, modelo, año); si no existen, crearlos.
4. Para cada aseguradora activa → para cada plan activo: `estrategia.cotizar(datos, plan)` → `PrimaCotizada { prima | null, disponible }`.
5. Si **ninguna** prima está disponible → `motivoDerivacion = NO_ASEGURABLE`, opciones = {ASESORIA}, y `DerivadorCasos.derivar(cotizacion, NO_ASEGURABLE)` crea `SolicitudAsesoria` (origen SISTEMA, estado PENDIENTE).
6. Por plan disponible: Opción 1 habilitada salvo que `ReglaInspeccion(aseguradora, uso).requiereInspeccion = true`. Opción 2 siempre visible.
7. Si **ningún** plan disponible tiene la Opción 1 → `motivoDerivacion = INSPECCION`, opciones = {ASESORIA}, derivación automática (origen SISTEMA).
8. `Cotizacion.opciones` (tabla `cotizacion_opcion`) guarda la **unión** de opciones habilitadas; la habilitación por plan se recalcula con la misma función de dominio para mostrarla.
9. Registrar en `RegistroActividad`.

## 6. Descuentos, prima final y canal
- `resolverDescuento(primeraCompraAplica, negociadoAceptado, max)` → porcentaje = `min(max(primeraCompra?, negociado?), max)` (RN-07, RN-08, RN-09).
- Primera compra: se evalúa cuando se conoce el `numeroDocumento` (paso de datos faltantes en CU-02, o al entrar por enlace de retoma). Si no hay póliza previa con ese documento → `Descuento { tipo: PRIMERA_COMPRA, porcentaje, aceptado: true, asesorId: null }`.
- Negociado: `Descuento { tipo: NEGOCIADO, asesorId, planId, porcentaje ≤ max }`; `aceptado = true` cuando el asesor registra que el cliente aceptó.
- `primaFinal = round(prima × (1 − porcentaje/100), 2)`.
- `atribuirCanal(origen)` (RN-27): enlace de retoma válido o descuento aceptado en seguimiento → TELEMARKETING; descuento NEGOCIADO aceptado → ASESORIA; si no → AUTONOMO. Se fija al crear la `OrdenCompra` y se copia a la `Poliza` al emitir.

## 7. Estados
- **Cotizacion**: `REGISTRADA` → `CONVERTIDA` (pago confirmado) | `NO_CONCRETADA` (abandono, o rechazo en asesoría). Una NO_CONCRETADA puede volver a CONVERTIDA si luego compra (por enlace o por su cuenta).
- **SolicitudAsesoria**: `PENDIENTE` → `EN_ATENCION` (asesor la toma; se fija `asesorId`) → `CERRADA` (con `resultado`).
- **Seguimiento**: `EN_SEGUIMIENTO` → `CONVERTIDO` (se confirma un pago de esa cotización) | `DESCARTADO` (cierre con motivo, o se agotan intentos/días → motivo NO_RESPONDE).
- **Pago / Cuota**: `PENDIENTE` → `CONFIRMADO` | `RECHAZADO`. En CUOTAS, la pasarela confirma el cargo de la cuota 1 → `Pago.CONFIRMADO`, cuota 1 CONFIRMADO y el resto PENDIENTE [Propuesta].
- **Poliza**: sin columna de estado (modelo final). Vigencia mostrada = `fechaEmision` + 12 meses.
- **Abandono** [Propuesta]: una cotización `REGISTRADA` sin orden con pago confirmado, con más de `MINUTOS_ABANDONO` (env, defecto 30) desde su fecha y sin solicitud de asesoría abierta → `NO_CONCRETADA` + `Seguimiento`. Lo ejecuta un job cada minuto y un botón del panel de demo. También entra a seguimiento la cotización cuya asesoría se cierra con "no acepta".

## 8. Casos de uso: flujo y alternativos que hay que implementar
**CU-01 Cotizar y comparar** — ver §5. Alternativos: 2a datos inválidos (errores por campo, conserva lo ingresado); 3a no asegurable; 3b fuera de nicho; 4a una o más aseguradoras no cotizan (se indican; si ninguna → 3a); 5a inspección (solo Opción 2, derivado con motivo INSPECCION); 6a abandona → luego seguimiento.

**CU-02 Comprar de forma autónoma** — 1) elige plan + "Comprar ahora": se verifica que la Opción 1 esté habilitada; resumen (vehículo, plan, prima). 2) registro mínimo o login; se asocia la cotización a la cuenta. 3) solo datos faltantes para emitir (mínimo: `numeroDocumento`, `apellidos` si faltan) validados; aquí se evalúa la primera compra. 4) acepta condiciones + firma simulada + modo de pago (cuotas ≤ `maxCuotas`; se muestra el cronograma). 5) paga: `PasarelaPago.cobrar()`. 6) `EmisorAseguradora.emitir()` → número de prueba. 7) PDF, canal (RN-27), cotización CONVERTIDA, seguimiento CONVERTIDO si existía — **pasos 5–7 en una transacción**. 8) confirmación, descarga, estado.
Alternativos: 1a Opción 1 no habilitada; 1b/4a cambia a Opción 2 conservando datos; 3a datos inválidos; 5a pago rechazado (no emite; puede reintentar o cambiar modo); 5b abandona antes de pagar (→ seguimiento por regla de abandono); 6a falla la emisión (rollback del pago, mensaje, log).

**CU-03 Solicitar asesoría / descuento** — 1) Opción 2 en un plan: formulario con datos precargados; 2) confirma canal y motivo; registro mínimo si hace falta; 3) `SolicitudAsesoria` PENDIENTE, origen CLIENTE, cola ordenada (RN-13), confirmación con tiempo estimado; 4) asesor toma el caso (EN_ATENCION) y ve todo; 5) registra descuento ≤ máximo; 6) registra resultado: si acepta → se habilita CU-02 con la prima negociada (canal ASESORIA); 7) cliente compra.
Alternativos: 1a derivación automática (origen SISTEMA, motivo INSPECCION o NO_ASEGURABLE; el asesor registra manualmente la prima y puede habilitar la compra); 2a canal incompleto; 6a no acepta → cotización NO_CONCRETADA + seguimiento; 6b no responde → seguimiento.

**CU-04 Gestionar seguimiento** — 1) cola EN_SEGUIMIENTO con vehículo, plan, prima, canal, intentos hechos/restantes; 2) detalle + descuento por primera compra si aplica; 3) contacto solo por canal preferido mientras `puedeContactar()`; 4) registrar intento (CONTACTADO, NO_RESPONDE, RECHAZA, ACEPTA); 5) si acepta → asocia descuento y genera/reactiva enlace de retoma; el caso pasa a CONVERTIDO cuando se confirma el pago (canal TELEMARKETING); 6) si no se concreta → cerrar con motivo → DESCARTADO; 7) un único mensaje final con enlace de `vigenciaEnlaceDias`.
Alternativos: 3a no responde y se agotan intentos/días → cierre automático; 3b quiere negociar → crea solicitud CU-03; 3c pide no ser contactado → cierre SIN_INTERES; 5a ya tuvo póliza → sin descuento; 6a ya contrató → cierre YA_CONTRATO; 7a falla el envío → log y botón reenviar; 7b enlace vencido → no hay venta, puede volver a cotizar.

**CU-05 Gestionar catálogo y reportes** — panel con: aseguradoras y planes (activar/desactivar), campos requeridos (agregar, editar, desactivar; valores permitidos), reglas de inspección por aseguradora × uso, parámetros comerciales, usuarios (crear asesores, activar/desactivar), reportes. Cada cambio + `RegistroActividad` en una transacción. Desactivar, no borrar. Reportes: número de pólizas y suma de `primaFinal` agrupadas por canal, aseguradora y plan, con filtro de fechas sobre `fechaEmision`.

## 9. Modelo de datos (PostgreSQL)
Reconstruido del diseño lógico de PC2 + lo expuesto del diseño físico el 30-oct: **22 tablas, 16 enums, 25 FK, 6 triggers**, PK `uuid` generadas por la BD, borrado en cascada solo en las 7 composiciones, RLS activado sin políticas (la app entra con conexión directa). Cambios de normalización expuestos: `cliente.nombres` se separa en `nombres` + `apellidos`; `cotizacion` ya no tiene `cliente_id` (se llega por `vehiculo`); `opcionesHabilitadas` pasa a la tabla `cotizacion_opcion`. La tabla 22 (`valor_permitido`) se deduce por el conteo de tablas y FK. **Si existe el DDL de la sección 3.5, ese manda** (ponerlo en `docs/fuentes/`).

| # | Tabla | Columnas (además de `id uuid PK`) | FK / restricciones |
|---|---|---|---|
| 1 | aseguradora | nombre text UNIQUE, activa bool def true, codigo_estrategia text UNIQUE | — |
| 2 | plan | nombre text, descripcion text, activo bool def true | aseguradora_id → aseguradora (agregación) · UNIQUE(aseguradora_id, nombre) |
| 3 | campo_requerido | nombre text (clave del dato), tipo TipoCampo, obligatorio bool, activo bool | aseguradora_id → aseguradora · UNIQUE(aseguradora_id, nombre) |
| 4 | valor_permitido | valor text | campo_requerido_id → campo_requerido **CASCADE** · UNIQUE(campo_requerido_id, valor) |
| 5 | regla_inspeccion | uso UsoVehiculo, requiere_inspeccion bool | aseguradora_id → aseguradora · UNIQUE(aseguradora_id, uso) |
| 6 | parametros_comerciales | descuento_primera_compra numeric(5,2), descuento_maximo numeric(5,2), max_intentos int, dias_seguimiento int, max_cuotas int, vigencia_enlace_dias int | fila única; CHECK de rangos (0–100, > 0) |
| 7 | usuario | email text UNIQUE, hash_contrasena text, rol Rol, activo bool | — |
| 8 | cliente | nombres text, apellidos text NULL, numero_documento text NULL, telefono text, email text NULL, canal_preferido CanalContacto | usuario_id → usuario UNIQUE NULL · índice (no único) en numero_documento, que se llena al comprar |
| 9 | vehiculo | uso UsoVehiculo, marca text, modelo text, anio int, clase text NULL, tipo text NULL | cliente_id → cliente · CHECK anio razonable |
| 10 | ubicacion_uso | departamento text, provincia text, distrito text | vehiculo_id → vehiculo UNIQUE **CASCADE** |
| 11 | cotizacion | fecha timestamptz def now(), estado EstadoCotizacion, motivo_derivacion MotivoAsesoria NULL | vehiculo_id → vehiculo · índice por fecha |
| 12 | cotizacion_opcion | opcion OpcionVenta | cotizacion_id → cotizacion **CASCADE** · UNIQUE(cotizacion_id, opcion) |
| 13 | prima_cotizada | prima numeric(10,2) NULL, disponible bool | cotizacion_id → cotizacion **CASCADE**, plan_id → plan · CHECK(disponible = (prima IS NOT NULL)) · UNIQUE(cotizacion_id, plan_id) · UNIQUE(cotizacion_id, id) |
| 14 | solicitud_asesoria | motivo MotivoAsesoria, estado EstadoSolicitud, canal CanalContacto, origen OrigenCaso, fecha_creacion timestamptz, resultado text NULL | cotizacion_id → cotizacion, asesor_id → usuario NULL (se fija al tomarla) |
| 15 | seguimiento | estado EstadoSeguimiento, intentos int def 0, fecha_apertura timestamptz, fecha_cierre NULL, motivo_cierre MotivoCierre NULL, enlace_token text NULL UNIQUE, enlace_expira_en timestamptz NULL | cotizacion_id → cotizacion UNIQUE · CHECK(estado = 'EN_SEGUIMIENTO' OR motivo_cierre IS NOT NULL OR estado = 'CONVERTIDO') |
| 16 | intento_contacto | canal CanalContacto, fecha timestamptz, resultado ResultadoIntento | seguimiento_id → seguimiento **CASCADE**, asesor_id → usuario |
| 17 | descuento | tipo TipoDescuento, porcentaje numeric(5,2), aceptado bool | cotizacion_id → cotizacion, plan_id → plan, asesor_id → usuario NULL (NULL en primera compra automática) |
| 18 | orden_compra | prima_final numeric(10,2), acepta_condiciones bool, firma_simulada bool, canal_venta CanalVenta, creado_en timestamptz | cotizacion_id UNIQUE, prima_cotizada_id UNIQUE · **FK compuesta (cotizacion_id, prima_cotizada_id) → prima_cotizada(cotizacion_id, id)**: la prima elegida es de su propia cotización |
| 19 | pago | monto numeric(10,2), modo ModoPago, estado EstadoPago, numero_cuotas int NULL, referencia text, fecha timestamptz | orden_compra_id → orden_compra **CASCADE** · CHECK(modo='UNICO' ⇔ numero_cuotas IS NULL) · índice único parcial (orden_compra_id) WHERE estado='CONFIRMADO' |
| 20 | cuota | numero int, monto numeric(10,2), estado EstadoPago | pago_id → pago **CASCADE** · UNIQUE(pago_id, numero) |
| 21 | poliza | numero text UNIQUE, fecha_emision timestamptz, archivo_pdf text, canal_venta CanalVenta | orden_compra_id → orden_compra UNIQUE · índice por fecha_emision (reportes) |
| 22 | registro_actividad | accion text, entidad text (p. ej. `Cotizacion#<id>`), fecha timestamptz | usuario_id → usuario NULL (acciones de invitado) |

Composiciones con CASCADE (7): valor_permitido, ubicacion_uso, cotizacion_opcion, prima_cotizada, intento_contacto, pago, cuota.

**Triggers** (migración SQL aparte; las mismas reglas también se validan en el dominio para dar errores claros). Los 4 que se expusieron:
1. El usuario asignado como asesor (`solicitud_asesoria.asesor_id`, `intento_contacto.asesor_id`, `descuento.asesor_id`) debe tener rol ASESOR y estar activo.
2. `descuento.porcentaje` ≤ `parametros_comerciales.descuento_maximo`.
3. `pago.numero_cuotas` ≤ `parametros_comerciales.max_cuotas`.
4. Un solo pago confirmado por orden (además del índice único parcial).
Los otros 2: tomarlos del DDL de la sección 3.5. Si no aparece, proponer: (5) `parametros_comerciales` no admite más de una fila; (6) `seguimiento.intentos` no supera `max_intentos`.

### Enums (16)
| Enum | Valores |
|---|---|
| Rol | CLIENTE, ASESOR, ADMINISTRADOR |
| UsoVehiculo | PARTICULAR, COMERCIAL_LIGERO, TRANSPORTE_PASAJEROS |
| CanalContacto | LLAMADA, WHATSAPP |
| EstadoCotizacion | REGISTRADA, CONVERTIDA, NO_CONCRETADA |
| OpcionVenta | COMPRA_INMEDIATA, ASESORIA |
| MotivoAsesoria | DUDA, NEGOCIACION, DESCUENTO, INSPECCION, NO_ASEGURABLE |
| OrigenCaso | SISTEMA, CLIENTE |
| EstadoSolicitud | PENDIENTE, EN_ATENCION, CERRADA |
| TipoDescuento | PRIMERA_COMPRA, NEGOCIADO |
| EstadoSeguimiento | EN_SEGUIMIENTO, CONVERTIDO, DESCARTADO |
| MotivoCierre | PRECIO, YA_CONTRATO, NO_RESPONDE, SIN_INTERES, OTRO |
| ResultadoIntento | CONTACTADO, NO_RESPONDE, RECHAZA, ACEPTA |
| ModoPago | UNICO, CUOTAS |
| EstadoPago | PENDIENTE, CONFIRMADO, RECHAZADO |
| CanalVenta | AUTONOMO, ASESORIA, TELEMARKETING |
| TipoCampo | TEXTO, NUMERO, LISTA |

## 10. Seed y tarifas de prueba [Propuesta — valores ficticios, solo para la simulación (RN-26)]
**Aseguradoras** (`codigo_estrategia`): Rímac (RIMAC), Pacífico (PACIFICO), La Positiva (LA_POSITIVA), Mapfre (MAPFRE), Quálitas (QUALITAS). Todas activas.
**Planes**: "Básico", "Intermedio" y "Full" por aseguradora (15), con descripción de coberturas genérica.
**Campos requeridos** (claves de dato: `uso, marca, modelo, anio, clase, tipo, departamento, provincia, distrito`):
- Rímac: marca, modelo, anio. Pacífico: marca, modelo, anio, departamento, provincia, distrito. La Positiva: marca, modelo, anio, clase, tipo. Mapfre y Quálitas: uso, marca, modelo, anio, departamento, provincia, distrito.
- Valores permitidos: `uso` = los 3 del enum; `marca` = Toyota, Hyundai, Kia, Nissan, Chevrolet, Suzuki, Mazda, Volkswagen, Honda, Mitsubishi; `clase` = AUTOMOVIL, CAMIONETA, SUV, PICK_UP, CAMION, BUS; `tipo` = SEDAN, HATCHBACK, STATION_WAGON, 4X2, 4X4; `departamento` = los 24 departamentos + Callao.
- El formulario siempre pide además contacto: nombres, teléfono, canal preferido; correo opcional (RN-04).
**Reglas de inspección**: las 5 aseguradoras × TRANSPORTE_PASAJEROS = true; resto false.
**Parámetros**: 5 % · 10 % · 4 intentos · 7 días · 12 cuotas · enlace 7 días.
**Usuarios**: los de `CLAUDE.md`. **Historial sintético** para que los reportes no salgan vacíos: ~80 pólizas repartidas en los últimos 90 días entre los 3 canales, 5 aseguradoras y 3 planes (clientes "Demo 01…"), creadas con filas coherentes (cotización → prima → orden → pago → póliza).

**Fórmula de prueba**: `prima = tarifaBase × factorPlan × factorUso × factorAntiguedad × recargoPropio`, redondeo a 2 decimales (soles, anual).
| Aseguradora | tarifaBase | Antigüedad máx. (si se pasa → `null`) | Recargo propio |
|---|---|---|---|
| Rímac | 1 450 | 15 años | — |
| Pacífico | 1 380 | 20 | `recargoUbicacion`: Lima/Callao 1,10; otro 1,00 |
| La Positiva | 1 290 | 16 | `recargoClaseTipo`: SUV/CAMIONETA 1,15; PICK_UP 1,20; otro 1,00 |
| Mapfre | 1 350 | 20 | — |
| Quálitas | 1 200 | 20 | — |
- `factorPlan`: Básico 0,75 · Intermedio 1,00 · Full 1,35 (en la estrategia, por nombre de plan; plan sin factor → `null`).
- `factorUso`: PARTICULAR 1,00 · COMERCIAL_LIGERO 1,25 · TRANSPORTE_PASAJEROS 1,60.
- `factorAntiguedad`: 0–3 años 1,10 · 4–10 años 1,00 · 11+ años 0,95.
- Antigüedad = año actual según el `Reloj` − `anio`. Además, `cliente@svas.demo` tiene en el seed una póliza previa con su DNI (para mostrar que no aplica RN-08).
- Con esto la demo cubre: auto 2022 (todas cotizan), auto 2009 (Rímac y La Positiva no cotizan → 4a), auto 2003 (ninguna → no asegurable), taxi (inspección → solo Opción 2), camión (fuera de nicho).

## 11. API REST propuesta (ajustable, pero mantener los prefijos por módulo)
- `GET /api/catalogo/formulario` — unión de campos activos con tipo, obligatoriedad y valores.
- `POST /api/cotizaciones` · `GET /api/cotizaciones/:id` (comparativo y opciones por plan) · `GET /api/cotizaciones/:id/estado`
- `POST /api/auth/registro` · `POST /api/auth/login` · `GET /api/auth/yo` · `POST /api/cotizaciones/:id/asociar`
- `POST /api/compras` (cotizacionId, primaCotizadaId) · `PATCH /api/compras/:id/datos` · `POST /api/compras/:id/confirmar` (condiciones, firma, modo, cuotas) · `POST /api/compras/:id/pagar`
- `GET /api/polizas/mias` · `GET /api/polizas/:id/pdf`
- `POST /api/asesoria/solicitudes` · `GET /api/asesor/cola` · `POST /api/asesor/solicitudes/:id/tomar` · `POST /api/asesor/solicitudes/:id/descuento` · `POST /api/asesor/solicitudes/:id/resultado`
- `GET /api/asesor/seguimientos` · `POST /api/asesor/seguimientos/:id/intentos` · `POST /api/asesor/seguimientos/:id/aceptar` · `POST /api/asesor/seguimientos/:id/cerrar` · `POST /api/asesor/seguimientos/:id/reenviar-mensaje`
- `GET /api/retoma/:token`
- `/api/admin/aseguradoras`, `/planes`, `/campos`, `/reglas-inspeccion`, `/parametros`, `/usuarios`, `GET /api/admin/reportes/ventas?desde&hasta&agrupar=canal|aseguradora|plan`
- Demo (solo `DEMO_MODE=true`, rol ADMINISTRADOR): `/api/demo/reloj` (adelantar días), `/api/demo/fallos` (pago rechazado, emisión fallida, aseguradora caída), `/api/demo/buzon` (mensajes simulados), `/api/demo/procesar-abandonos`, `/api/demo/reset`
