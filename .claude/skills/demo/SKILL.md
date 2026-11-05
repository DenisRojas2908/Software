---
name: demo
description: Ensaya la demo del SVAS (disponible desde F7). Levanta la app con el seed, recorre docs/GUIA_DEMO.md con Playwright, toma capturas a 360 px y 1366 px, y verifica el aviso de simulación y que no se pidan datos de tarjeta o bancarios. Reporta lo que falle.
---

# Demo

1. Requisito: existe `docs/GUIA_DEMO.md` (se crea al cerrar F7). Si no existe, avisa y termina.
2. BD con seed: `npm run db:reset` (si lo ejecuta un agente, Prisma lo bloquea: usar `cd apps/api && npx prisma migrate deploy && npx tsx prisma/seed.ts`, D-44). Luego `npm run build` y `DEMO_MODE=true JOB_SEGUIMIENTO=false npm start` en segundo plano. Espera a que `http://localhost:3000/api/salud` responda.
3. Ejecuta `node scripts/guion-demo.cjs <scratchpad>/demo` (Playwright, `chromium.launch()` sin opciones; no reinstales). Recorre los 10 pasos de la guía y devuelve un JSON con fallas y verificaciones. Si cambia la guía, actualiza el script.
4. En cada pantalla, captura a **360 px** y **1366 px** de ancho (deviceScaleFactor 1). Guárdalas en el scratchpad, nombradas `paso-NN-<pantalla>-<ancho>.png`.
5. En cada pantalla verifica:
   - que el aviso «Simulación académica» esté visible;
   - que no haya inputs ni textos que pidan número de tarjeta, CVV, fecha de vencimiento ni datos bancarios (busca `tarjeta`, `cvv`, `cvc`, `card`, `cuenta bancaria`, `autocomplete="cc-*"`);
   - que no haya desborde horizontal a 360 px (`scrollWidth > clientWidth`).
6. Detén el servidor.
7. Reporta una tabla: paso · resultado (ok / falla) · detalle · captura. Lista primero lo que falle.
