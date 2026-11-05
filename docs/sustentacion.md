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
