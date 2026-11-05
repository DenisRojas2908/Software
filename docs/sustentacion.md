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
