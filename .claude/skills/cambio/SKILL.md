---
name: cambio
description: Aplica un cambio pedido por Denis con /cambio <pedido>. Lo clasifica, lo contrasta con la especificación y las decisiones, se detiene si contradice un RF o RN, y si no, lo implementa con test, D-xx, COMO_CAMBIAR y checkpoint.
disable-model-invocation: true
---

# Cambio

Pedido: $ARGUMENTS

1. Clasifica el cambio: **parámetro o texto** · **pantalla** · **regla de negocio o estructura** (modelo de datos, módulos, API).
2. Busca en `docs/02-especificacion.md` y `docs/04-decisiones.md` todo lo que toque el cambio (RF, RN, RNF, D-xx, tablas, enums).
3. Si contradice un RF o una RN: **detente**. Muestra la contradicción citando la sección exacta (archivo, §, ID) y propone opciones. No implementes nada.
4. Si es un parámetro que ya se configura desde el admin (ver `docs/COMO_CAMBIAR.md`), dile a Denis cómo cambiarlo sin código y pregunta si igual quiere cambiar el valor inicial del seed.
5. Si no contradice nada: impleméntalo con su test (nombre con el ID: `it('RN-xx: …')` o `it('D-xx: …')`).
6. Regístralo en `docs/04-decisiones.md` como D-xx (siguiente número libre, estado Tomada, con el porqué). Actualiza `docs/COMO_CAMBIAR.md` y, si aplica, `docs/trazabilidad.md` y `docs/MAPA.md`.
7. Haz `checkpoint`.
8. Termina diciendo qué cambió (archivos), qué test lo cubre y qué debe revisar Denis (pantalla, flujo o documento entregado que pueda contradecir).
