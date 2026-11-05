# Estado actual del SVAS

## Último checkpoint
2026-11-04 20:15 (Lima) · rama `feat/f0-arranque` · último commit `c529d7b` (chore: sistema de memoria y skills)

## Fase y paso actual
**F0 · Arranque**, paso 0 de 6 terminado: sistema de memoria, skills, auditor y hook. **Esperando confirmación de Denis para seguir.**
Pasos de F0: 1 decisiones en 04 + corrección de 02 §6 · 2 monorepo · 3 api salud · 4 web inicio · 5 CI ubuntu+windows · 6 README/trazabilidad/sustentación → `cerrar-fase`.

## Qué funciona y cómo verlo
- Todavía no hay app (sin `package.json`). Funciona la memoria: `docs/ESTADO.md`, `docs/BITACORA.md`, `docs/MAPA.md`, `docs/COMO_CAMBIAR.md`.
- Skills en `.claude/skills/`: `retomar`, `checkpoint`, `cerrar-fase`, `/cambio`, `demo`. Subagente `auditor`. Hook SessionStart (`npm ci` solo en la nube).
- BD del contenedor: Postgres 16 con `svas` y `svas_test` (usuario `postgres` / clave `postgres`, solo en la nube).

## Siguiente paso exacto
F0 paso 1: `docs/04-decisiones.md`. Pasar D-11, D-21, D-22, D-23 y D-24 a Tomada con las respuestas de Denis; agregar D-25…D-43 (N3–N19 + caso mixto de RN-27) como Tomada; registrar la corrección de 02 §6. Luego corregir `docs/02-especificacion.md` §6 (canal provisional al crear la orden; el definitivo se calcula en la transacción de pago), con autorización de Denis.

## Decisiones Propuesta que esperan visto bueno
Ninguna. N1–N19 aprobadas; N8 aprobada (ASESORIA sin descuento si la solicitud cerró con ACEPTA).

## Riesgos o deudas
- No puedo verificar el Windows de Denis: lo cubrirá el job `windows-latest` del CI (F0 paso 5) + `npm install` / `npm run dev` hechos por Denis.
- Versiones fijadas (D-25): NestJS 11, TS 5.9, Prisma 7.10, Jest 30. No subir a NestJS 12 / TS 7 (rompen Jest/ts-jest).
- El hook todavía no se probó con el `package-lock.json` real (se probó en una copia: instala, salta y reinstala).

## Estado del CI
Sin workflow todavía (llega en F0 paso 5). ubuntu: — · windows: —
