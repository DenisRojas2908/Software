---
name: checkpoint
description: Guarda el estado del trabajo en el repo (memoria del proyecto). Verifica lint, test y build; sobrescribe docs/ESTADO.md; agrega una entrada a docs/BITACORA.md; actualiza MAPA, COMO_CAMBIAR y trazabilidad si cambiaron; hace commit y push de la rama de fase. Úsala al terminar cada paso importante, al cerrar una fase, antes de una tarea larga, antes de detenerte o si pasaron más de 60 minutos desde el último checkpoint.
---

# Checkpoint

1. `npm run lint`, `npm test` y `npm run build` (si existe `package.json`). Si algo falla, arréglalo antes de seguir. Si no se puede arreglar ahora, el checkpoint se hace igual, pero el fallo se anota como riesgo en ESTADO.md (nunca se oculta).
2. Hora de Lima: `TZ=America/Lima date '+%Y-%m-%d %H:%M'`.
3. **Sobrescribe** `docs/ESTADO.md` (máximo 40 líneas) con estas secciones: Último checkpoint (fecha y hora de Lima, rama, commit) · Fase y paso actual · Qué funciona y cómo verlo (comando, URL, usuario demo) · Siguiente paso exacto (archivo y tarea) · Decisiones en estado Propuesta que esperan visto bueno · Riesgos o deudas · Estado del CI (ubuntu / windows).
   - Como el hash del commit no se conoce antes de hacerlo, escribe el último commit **anterior** y la rama.
4. **Agrega arriba** en `docs/BITACORA.md` una entrada con: fecha y hora · fase · qué se hizo · archivos tocados · decisiones (D-xx) · pruebas (cuántas pasan y qué RN cubren) · «Para defender» (1 a 3 puntos: concepto, archivo y la pregunta del jurado) · siguiente paso.
5. Si cambió la estructura, actualiza `docs/MAPA.md` (explicando para alguien que sabe Python cada concepto nuevo). Si cambió algún parámetro o texto visible, actualiza `docs/COMO_CAMBIAR.md` (archivo:línea). Si se implementó un RF o RN, actualiza `docs/trazabilidad.md`.
6. `git add -A`, luego commit en español con prefijo convencional (`chore(checkpoint): FN …` si solo es memoria).
7. `git push -u origin <rama feat/fN-…>`. Si falla la red, reintenta con espera de 2, 4, 8 y 16 s. **No hagas merge a main** (eso es de `cerrar-fase`).
