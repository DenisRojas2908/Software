---
name: cerrar-fase
description: Cierra una fase del plan del SVAS. Verifica los criterios de aceptación de docs/03-plan.md, completa sustentacion.md, abre el PR a main, espera el CI en verde (ubuntu y windows), mergea y crea la rama de la siguiente fase. Úsala cuando una fase está terminada.
---

# Cerrar fase

1. Abre la sección de la fase en `docs/03-plan.md` y verifica **uno por uno** sus criterios «Acepta si», además de la Definición de terminado de CLAUDE.md. Hazlo con evidencia (comando, test o captura). Lista cuáles **no** se cumplen y díselo a Denis. Si alguno bloquea, no sigas al paso 3.
2. Completa en `docs/sustentacion.md` la sección de la fase: preguntas probables del jurado, respuesta en 3 líneas y archivo donde se ve. Revisa también que `docs/trazabilidad.md` esté al día.
3. Haz `checkpoint` (lint, test, build, memoria, push).
4. Abre un PR de `feat/fN-…` a `main` con el MCP de GitHub (`mcp__github__create_pull_request`, repo `denisrojas2908/software`). El cuerpo sigue la plantilla del repo si existe; si no: Resumen, CU/RF/RN cubiertos, Cómo probar, Pruebas, Decisiones nuevas.
5. Espera el CI: consulta los checks del último commit del PR (`mcp__github__pull_request_read` / `actions_list`) hasta que los jobs **ubuntu** y **windows** terminen. No hagas polling con `sleep` en bucle: suscríbete a la actividad del PR o espera eventos. Si falla, reproduce el error en local, corrígelo, haz push y vuelve a esperar. Si falla dos veces seguidas con el mismo error, detente y avisa.
6. Con ambos en verde: merge del PR (`mcp__github__merge_pull_request`, método merge).
7. `git fetch origin && git checkout -b feat/f(N+1)-<nombre> origin/main`, y luego `git push -u origin` de esa rama.
8. `checkpoint` en la nueva rama: ESTADO.md con «Fase N+1, paso 0» y la entrada en BITACORA.md del cierre.
