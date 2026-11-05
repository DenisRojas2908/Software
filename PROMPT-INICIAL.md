# Cómo arrancar (para Denis)

1. Crea el repo vacío en GitHub (sin README, sin .gitignore) y clónalo **fuera de OneDrive**, p. ej. `C:\dev\svas`.
2. Copia dentro del repo: `CLAUDE.md`, la carpeta `docs/` completa y este archivo.
3. Si tienes el DDL o la PPT de tus secciones 3.5 / 4.1 / 4.2, cópialos a `docs/fuentes/`.
4. Abre Claude Code en esa carpeta y pega el mensaje de abajo.

---

## Mensaje para pegar en Claude Code

Lee `CLAUDE.md` y luego `docs/01-analisis.md`, `docs/02-especificacion.md`, `docs/03-plan.md` y `docs/04-decisiones.md`. Consulta `docs/fuentes/` solo cuando necesites un detalle.

Vamos a construir la simulación del SVAS como monolito modular, fase por fase según `docs/03-plan.md`.

Antes de escribir código:
1. Hazme en una sola tanda las preguntas de las decisiones **Pendiente** de `docs/04-decisiones.md` (D-11, D-21, D-22, D-23, D-24) y anota mis respuestas en ese archivo.
2. Si al leer encuentras contradicciones o huecos que no estén ya listados en `01-analisis.md` §6–7 o en `04-decisiones.md`, dímelos en una lista corta.
3. Verifica mi entorno (Windows): versión de Node y npm, git, y si tengo Docker.

Después, en modo plan, muéstrame el plan de la **Fase 0** y empieza cuando te diga "sigue". Al terminar cada fase, para y repórtame según la sección "Forma de trabajo" de `CLAUDE.md`.
