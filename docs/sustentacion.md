# Guía de sustentación (por fase)

Por fase: las preguntas probables del jurado, la respuesta en 3 líneas y el archivo donde se ve. Se completa al cerrar cada fase (skill `cerrar-fase`).

## F0 · Arranque del repositorio
**¿Por qué un monolito si les pidieron algo escalable?**
El diagrama de paquetes de PC2 ya dice «monolito modular»: módulos con una sola responsabilidad y sin ciclos. La API no guarda sesión (JWT), así que se puede replicar detrás de un balanceador.
Un solo proceso simplifica la demo y la transacción de compra (RNF-05). → `apps/api/src/app.module.ts`, `docs/04-decisiones.md` D-01.

**¿Cómo saben que el sistema funciona también en Windows si lo desarrollaron en Linux?**
El CI corre en cada push dos jobs: Ubuntu (con Postgres: lint, pruebas, build) y Windows (instalación, build, pruebas unitarias).
Solo se mergea a `main` con ambos en verde. → `.github/workflows/ci.yml`, D-42.

**¿Por qué NestJS 11 y no la última versión?**
NestJS 12 solo funciona como módulo ESM y TypeScript 7 no es compatible con ts-jest; eso rompía las pruebas con Jest, que es el estándar fijado (D-04).
Fijamos versiones estables y probadas (D-25). → `apps/api/package.json`.

## F1 · Modelo de datos, restricciones y seed
**¿El esquema coincide con su diseño físico?**
Sí: 22 tablas, 16 enums y 25 FK (se pueden contar en `prisma/migrations/*_init/migration.sql`). Nombres de modelo en español, como el diagrama de clases.
Desviaciones registradas: `vehiculo.datos_adicionales` (D-11) y la FK simple extra de orden_compra (D-27). → `apps/api/prisma/schema.prisma`.

**¿Para qué triggers si ya validan en el código?**
El dominio da mensajes claros; la BD es la última barrera si un bug o una consulta manual se salta el código.
Ej.: T2 rechaza un descuento de 12 % con máximo 10 % y hay un test que lo prueba. → `*_restricciones/migration.sql`, `test/restricciones-bd.e2e-spec.ts`.

**¿Cómo garantizan que la orden de compra use una prima de su propia cotización?**
Con una FK compuesta `(cotizacion_id, prima_cotizada_id) → prima_cotizada(cotizacion_id, id)`; la BD rechaza mezclar cotizaciones.
→ `schema.prisma` (modelo `OrdenCompra`), test «FK compuesta».

**¿Dónde están el 5 %, el 10 % y los 4 intentos?**
Solo en el seed (`prisma/seed.ts:7-14`) y luego en la tabla `parametros_comerciales`, que el admin edita (RNF-13). El código los lee de la BD.

## F2 · Seguridad
**¿Cómo impiden que un asesor entre al panel de administración?**
Un guard global revisa cada petición: sin token → 401; con un rol no listado en `@Roles('ADMINISTRADOR')` → 403. La UI oculta el menú, pero la protección real está en el backend.
Una prueba recorre todos los endpoints protegidos × los 3 roles (RNF-10). → `seguridad/autenticacion.guard.ts`, `test/permisos.e2e-spec.ts`.

**¿Cómo evitan que un cliente vea la póliza de otro?**
Además del rol, se verifica la propiedad: el recurso debe pertenecer al usuario de la sesión (`verificarPropiedad`). Si no, 403.
→ `seguridad/propiedad.ts`, `propiedad.spec.ts`.

**¿Cómo guardan las contraseñas?**
Con bcrypt (hash con sal, 10 rondas): nunca en claro ni se devuelven en la API. La sesión es un JWT que expira (`JWT_EXPIRA`, 2 h).
→ `seguridad/auth.service.ts`.

**¿Por qué un Reloj propio y no `new Date()`?**
Para poder adelantar el tiempo en la demo (enlace vencido a los 7 días) y fijarlo en las pruebas. Es un puerto con dos implementaciones (inversión de dependencias).
→ `comun/reloj.ts`.

## F3 · Cotizar y comparar (CU-01)
**¿Dónde se ve el patrón Strategy?**
`EstrategiaCotizacion` es la interfaz y hay una clase por aseguradora. `CotizacionService` recibe todas en un arreglo y las busca por `codigo_estrategia` del catálogo, sin `if` ni `switch` por aseguradora.
Agregar HDI = nueva clase + fila en el catálogo (abierto/cerrado, RNF-14). → `cotizacion/estrategia/estrategias.ts`, `cotizacion.service.ts`.

**¿Cómo deciden si un plan permite "Comprar ahora"?**
Con la función pura `calcularOpciones()`: el plan debe cotizar y su aseguradora no debe exigir inspección para ese uso (RN-25, tabla `regla_inspeccion`). Si ninguno cotiza → NO_ASEGURABLE; si ninguno puede comprarse → INSPECCION, y se deriva.
Tiene 6 pruebas unitarias sin BD. → `cotizacion/dominio/calcular-opciones.ts`.

**¿Cómo cotización deriva a asesoría sin depender de ese módulo?**
Define el puerto `DerivadorCasos` (una interfaz) y lo pide por un token; el módulo de asesoría lo implementa (F5). Es inversión de dependencias: no hay ciclo entre módulos.
→ `cotizacion/derivador-casos.ts`.

**¿El formulario está escrito a mano?**
No: es la unión de los campos requeridos de las aseguradoras activas (tabla `campo_requerido`), más uso/marca/modelo/año que siempre se piden (D-26). Si el admin activa un campo, aparece sin tocar código.
→ `dominio-compartido/catalogo/formulario.ts`.

**¿Por qué el auto 2009 no lo cotizan Rímac ni La Positiva?**
Son tarifas de prueba: cada aseguradora tiene una antigüedad máxima (Rímac 15 años, La Positiva 16). 2026 − 2009 = 17 → devuelven `null` y el comparativo las muestra como «no cotizan».
→ `estrategias.ts:28,45`, `estrategias.spec.ts`.

## F4 · Compra autónoma, pagos y pólizas (CU-02)
**¿Cómo garantizan que la compra sea atómica (RNF-05)?**
Pago confirmado, cuotas, emisión, póliza, PDF y cambios de estado van en UNA `prisma.$transaction`. Si la aseguradora falla al emitir, la transacción se revierte y además se anula el cobro en la pasarela.
Hay una prueba que fuerza la falla y verifica que no queda pago confirmado ni póliza. → `compra/compra.service.ts` (`pagar`), `test/compra.e2e-spec.ts`.

**¿Qué pasa si el pago es rechazado?**
No se emite; se guarda el pago RECHAZADO (para auditoría) y el cliente puede reintentar o cambiar el modo. Además, un índice parcial impide dos pagos confirmados en la misma orden.
→ `compra.service.ts`, migración `restricciones`.

**¿Cómo se decide el 5 % de primera compra?**
Cuando el cliente ingresa su DNI (el único momento en que se conoce) se busca si ese documento ya tiene una póliza. Si no la tiene, se registra un `Descuento PRIMERA_COMPRA` con el porcentaje de `parametros_comerciales`. cliente@svas.demo tiene una póliza previa y no lo recibe.
→ `compra.service.ts` (`contexto`, `completarDatos`), `descuentos.ts`.

**Si el asesor negocia 8 % y el cliente es primerizo (5 %), ¿cuánto se descuenta?**
8 %: RN-09 dice que no se acumulan y se aplica el mayor, sin pasar el máximo (10 %). Es la función pura `resolverDescuento()` con 8 pruebas.
→ `compra/dominio/descuentos.ts`.

**¿Cómo cambiarían a una pasarela real?**
La compra depende del puerto `PasarelaPago`; hoy lo implementa `PasarelaSimulada`. Una real (Niubiz, Culqi…) sería otra clase registrada en `integracion.module.ts`, sin tocar `CompraService` (RNF-15).
→ `integracion/pasarela/*`.

**¿Por qué el PDF dice "sin validez legal"?**
RNF-20 y D-19: es una simulación académica. La marca de agua y el pie se dibujan en todas las páginas.
→ `integracion/pdf/generador-pdfkit.ts`.
