# 01 · Análisis del proyecto para la construcción

## 1. Contexto de curso (por qué importa para el código)
- Curso SI707V Ingeniería de Software, 2026-2. Grupo 4: Espinoza Esteban, Flores Huayllaquispe, Rojas Chamochumby, Sehuin Guevara, Vázquez García.
- Nota: **PF = (EP + PP + 2·EF) / 4**. El **EF es la sustentación de la codificación completa**: vale la mitad del curso. PP = promedio de P1…P5 sin la menor.
- Hitos que quedan (sílabo + ficha; confirmar fechas exactas con el profesor):
  - **P3** — diseño parte II, presentación de interfaces, codificación de interfaces parte I.
  - **P4** — interfaces finales, codificación parte II, conectividad a BD, prototipo.
  - **P5** — pruebas unitarias e integrales, configuración, manuales, consolidado de entregables.
  - **EF** — sustentación de la codificación completa.
- Ya entregado:
  - **Ficha** (sem. 3): problema, alcance, límites, competencias.
  - **Práctica 1 = Análisis**: AS-IS, stakeholders, actores, fronteras, entrevistas, competencia, 4 escenarios, **33 RF, 20 RNF, 27 RN**, 5 CU detallados, DFD 0 y 1, arquitectura preliminar, SWEBOK/SEBoK/ISO 12207/15288.
  - **Práctica 2 = Diseño** (presentada el 30-oct): diagrama de paquetes (**monolito modular**), clases, secuencia de los 5 CU, modelo relacional (20 entidades, 24 relaciones), normalización, **diseño físico (22 tablas, 16 enums, 25 FK, 6 triggers)**, arquitectura lógica y física, componentes.

## 2. Problema y propuesta en cinco líneas
SeguroSimple.com permite cotizar y comparar seguros vehiculares en línea, pero **ninguna venta se cierra sin que un asesor llame o escriba por WhatsApp**. Eso frena al cliente que ya sabe qué quiere y deja perderse sin registro a quien cotiza y no compra.
El SVAS propone un **flujo dual**: Opción 1 compra 100 % autónoma; Opción 2 asesoría, negociación o descuento (y derivación obligatoria cuando la aseguradora exige inspección o el vehículo no es asegurable en línea).
Además, una **cola de seguimiento** con reglas (canal preferido, máximo 4 intentos en 7 días, motivo de cierre, un único mensaje final con enlace de retoma) y un **panel administrativo** que cambia catálogo y parámetros sin tocar código.

## 3. Qué tiene que verse funcionando
| CU | Actor | Lo que la demo debe mostrar |
|---|---|---|
| CU-01 Cotizar y comparar | Cliente (sin cuenta) | Formulario armado desde el catálogo (unión de campos de las aseguradoras activas), validación por campo en backend, comparativo de primas de 5 aseguradoras × planes, opciones habilitadas por plan; casos: aseguradora que no cotiza, vehículo no asegurable, fuera de nicho, transporte de pasajeros (solo Opción 2). |
| CU-02 Comprar de forma autónoma | Cliente | Resumen, registro/login que conserva la cotización, solo datos faltantes, firma simulada, pago único o en cuotas, emisión simulada, **PDF descargable**, descuento por primera compra, canal atribuido, consulta de estado. Fallos: pago rechazado y emisión fallida con reversión. |
| CU-03 Solicitar asesoría / descuento | Cliente + Asesor | Solicitud sin re-digitar datos, cola con derivados primero, asesor aplica descuento ≤ máximo, cliente acepta y compra con prima negociada (canal ASESORIA). |
| CU-04 Seguimiento de telemarketing | Asesor | Cola de no concretadas, intentos por canal preferido con límite, cierre con motivo obligatorio, mensaje final con enlace de 7 días, compra desde enlace (canal TELEMARKETING), enlace vencido. |
| CU-05 Catálogo y reportes | Administrador | Activar/desactivar aseguradoras y planes, editar campos requeridos y reglas de inspección, parámetros comerciales, usuarios, reportes por canal/aseguradora/plan y periodo; todo con registro de actividad. |

**Fuera de alcance** (límites ya declarados): cobros reales, emisión vinculante, siniestros, firma electrónica certificada, otros ramos y SOAT, flotas > 5, pesados y carga, app nativa, reemplazar al asesor en casos complejos. También quedan fuera ideas de la ficha que **no** pasaron a los RF finales: excluir aseguradoras con seguro vigente, simular variantes del vehículo, bloqueo de cuenta por intentos, recuperación de contraseña por correo, alertas de vencimiento (RF-33 es backlog).

## 4. Qué es real y qué es simulado
| Real (código que funciona de verdad) | Simulado (detrás de una interfaz reemplazable) |
|---|---|
| Persistencia en PostgreSQL, transacciones, restricciones | Tarifas de cada aseguradora (estrategias con tarifas de prueba, RN-26) |
| Reglas de derivación, descuentos, intentos, atribución de canal | Emisión de la póliza (número de prueba) |
| Autenticación, roles, propiedad de datos | Pasarela de pago (confirma o rechaza a pedido) |
| Generación del PDF | Firma (casilla de aceptación) |
| Reportes | Mensajería al cliente (llamada / WhatsApp / mensaje final → "buzón simulado") |
| Registro de actividad | Paso del tiempo (reloj de demo para mostrar 7 días y enlaces vencidos) |

## 5. "Monolito" vs. "nos pidieron que sea escalable"
No hay contradicción con lo entregado: el diagrama de paquetes de PC2 ya declara **monolito modular**. La escalabilidad se defiende así: módulos con una responsabilidad y sin ciclos (se pueden separar después si hiciera falta), backend sin estado de sesión (JWT) que se puede replicar detrás de un balanceador, BD gestionada, integraciones detrás de puertos, y configuración en datos. Las metas de capacidad (RO-01/02: 10 000 cotizaciones/mes, 200 clientes simultáneos) se declararon como **metas de diseño a validar con una prueba de carga**, no como volumen actual: opcionalmente se corre una prueba corta y se reporta el número.

## 6. Inconsistencias en los entregables (pueden preguntarlas en la sustentación)
| # | Inconsistencia | Cómo queda en el código | ¿Corregir el documento? |
|---|---|---|---|
| I1 | PC1 dice backend **Java/Spring Boot**, OpenPDF y JUnit; PC2 dice **NestJS + TypeScript** | NestJS, pdfkit, Jest | Sí: RNF-10 y RNF-16 todavía dicen "JUnit" |
| I2 | Ficha y `Entregable.md` listan **6** aseguradoras (con HDI); PC1/PC2 usan **5** | 5: Rímac, Pacífico, La Positiva, Mapfre, Quálitas | Solo si se reutiliza la ficha |
| I3 | BD: la PPT de PC1 dice **Neon** en la tabla y Supabase en el despliegue | PostgreSQL en Supabase | Sí, en la PPT |
| I4 | El diagrama de paquetes dice "repositorios que usan el **cliente de Supabase**", pero RNF-05 exige compra atómica. supabase-js (PostgREST) no permite transacciones de varias sentencias | Prisma con conexión directa a Postgres (Supabase) → transacciones reales | Sí: una línea en 2.1 (persistencia) |
| I5 | La ficha propone patrón **State** y estados de póliza; el modelo final de `Poliza` no tiene `estado` | Se sigue el modelo final: el estado se deriva (pago, orden, vigencia) | No |
| I6 | `Cotizacion.opcionesHabilitadas` es por cotización, pero la inspección es **por aseguradora y uso** (RN-25) | La cotización guarda la unión; la habilitación de la Opción 1 se calcula **por plan** | Basta explicarlo |
| I7 | Ficha: Docker; RNF-19: sin contenedores propios | Sin Docker para desplegar (Docker solo opcional para la BD local) | No |

## 7. Huecos de especificación que el código necesita cerrar
Detalle y valor por defecto en `04-decisiones.md`:
- Firma de la estrategia: el diagrama dice `cotizar(datos)`, pero la prima es **por plan** → `cotizar(datos, plan)`.
- Cómo se diferencia la tarifa entre planes de una misma aseguradora (Plan no tiene precio ni factor).
- Dónde se guarda el valor de un **campo nuevo** que el admin agregue y no tenga columna (RNF-13 promete "solo configuración").
- Cuándo una cotización pasa a **no concretada** (abandono) y entra a seguimiento.
- Valor inicial de `maxCuotas` (RN-14 no lo da) y si las cuotas tienen recargo.
- Cómo se detecta "fuera de nicho" (RN-05) si el uso no tiene "carga/pesado".
- "Sin pedir correo" (RN-04) frente a los datos de contacto: el correo es opcional al cotizar.
- Cómo se asocia la cotización de invitado a la cuenta cuando el cliente se registra o inicia sesión.

## 8. Riesgos para la demo
| Riesgo | Mitigación |
|---|---|
| Supabase pausa proyectos gratuitos tras días sin uso; o falla la red del aula | Ensayar con la base local; tener `db:reset` + seed; abrir el proyecto Supabase el día anterior |
| Supabase: la conexión directa es IPv6; muchas redes solo tienen IPv4 | Usar la cadena del **pooler en modo sesión** (IPv4) — coincide con lo dicho en el diseño físico ("conexión por IPv4") |
| Repo dentro de **OneDrive**: sincroniza miles de archivos de `node_modules` y bloquea archivos | Clonar el repo fuera de OneDrive (p. ej. `C:\dev\svas`) |
| El código no coincide con los diagramas que presentó cada integrante | Nombres del dominio iguales a los diagramas; `trazabilidad.md` |
| Nadie sabe explicar un módulo | `sustentacion.md` por módulo; cada integrante ensaya su parte |
| Falta de tiempo | Orden del plan: núcleo CU-01/CU-02 primero; luego CU-05, CU-03, CU-04; demo y pruebas al final |
