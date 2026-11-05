# Bitácora del proyecto SVAS

Solo se agrega; la entrada más reciente va arriba. Formato por checkpoint: fecha y hora (Lima) · fase · qué se hizo · archivos tocados · decisiones · pruebas · «Para defender» · siguiente paso.

---

## 2026-11-04 20:15 (Lima) · F0 · Sistema de memoria y skills
- **Qué se hizo**: lectura de CLAUDE.md y docs/01–04; detección de N1–N19 (contradicciones y huecos nuevos); respuestas de Denis a D-11, D-21, D-22, D-23 y D-24; plan de F0 aprobado con ajustes (N8 aprobado, caso mixto → TELEMARKETING, canal definitivo en la transacción de pago). Se montó la memoria en el repo (este archivo, ESTADO, MAPA, COMO_CAMBIAR, trazabilidad, sustentacion), las skills `retomar`, `checkpoint`, `cerrar-fase`, `cambio`, `demo`, el subagente `auditor` y el hook SessionStart. Rama `feat/f0-arranque` creada desde `main`. Postgres 16 del contenedor levantado con las bases `svas` y `svas_test`.
- **Archivos tocados**: `CLAUDE.md`, `.gitattributes`, `.claude/settings.json`, `.claude/hooks/session-start.sh`, `.claude/skills/*/SKILL.md`, `.claude/agents/auditor.md`, `docs/ESTADO.md`, `docs/BITACORA.md`, `docs/MAPA.md`, `docs/COMO_CAMBIAR.md`, `docs/trazabilidad.md`, `docs/sustentacion.md`.
- **Decisiones**: D-11 jsonb, D-21 local + Railway, D-22 Postgres en Windows, D-23 ramas feat/fN con PR, D-24 sin DDL. N1–N19 aprobadas. **Aún sin registrar en `04-decisiones.md`**: es el siguiente paso.
- **Pruebas**: 0 (todavía no hay código ni `package.json`).
- **Para defender**:
  1. *Gestión de configuración*: rama por fase + PR + CI antes de mergear a `main` (archivo `.claude/skills/cerrar-fase/SKILL.md`). Pregunta probable del jurado: «¿Cómo garantizan que `main` siempre funciona?» → Solo se mergea con el CI en verde en Ubuntu y Windows.
  2. *Trazabilidad*: cada RF/RN apunta a un archivo y un test (`docs/trazabilidad.md`). Pregunta probable: «¿Dónde está implementada RN-09?» → En la tabla, con su test.
- **Siguiente paso**: F0 paso 1, registrar decisiones en `docs/04-decisiones.md` y corregir `docs/02-especificacion.md` §6 (canal definitivo en la transacción de pago).
