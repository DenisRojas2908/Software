# Cómo cambiar parámetros y textos

Para cada valor de negocio o texto visible: ¿se cambia **desde el panel de admin sin tocar código** (CU-05, RNF-13) o **en el código**? Archivo y línea se completan cuando el código existe.

> Los valores de negocio solo viven en el seed (RNF-13). Cambiar el seed afecta solo a una BD nueva (`npm run db:reset`); en una BD en uso se cambian desde el admin (F7).

| Valor / texto | Valor inicial | ¿Cómo se cambia? | Dónde (archivo:línea) | Fase |
|---|---|---|---|---|
| Descuento por primera compra (RN-08) | 5 % | Admin → Parámetros (sin código) | Valor inicial: `apps/api/prisma/seed.ts:8` | F1 (seed) · F7 (pantalla) |
| Descuento máximo de negociación (RN-07) | 10 % | Admin → Parámetros | `apps/api/prisma/seed.ts:9` | F1 · F7 |
| Máximo de intentos de seguimiento (RN-10) | 4 | Admin → Parámetros | `apps/api/prisma/seed.ts:10` | F1 · F7 |
| Días de seguimiento (RN-10) | 7 | Admin → Parámetros | `apps/api/prisma/seed.ts:11` | F1 · F7 |
| Vigencia del enlace de retoma (RN-12) | 7 días | Admin → Parámetros | `apps/api/prisma/seed.ts:13` | F1 · F7 |
| Máximo de cuotas (RN-14) | 12 | Admin → Parámetros | `apps/api/prisma/seed.ts:12` | F1 · F7 |
| Inspección por aseguradora × uso (RN-25) | TRANSPORTE_PASAJEROS = sí | Admin → Reglas de inspección | `apps/api/prisma/seed.ts:157` | F1 · F7 |
| Campos requeridos y valores permitidos (RN-17…RN-23) | ver 02 §10 | Admin → Campos | `apps/api/prisma/seed.ts:92` (campos) y `:44-60` (valores) | F1 · F7 |
| Activar/desactivar aseguradora o plan (RN-16) | todas activas | Admin → Aseguradoras / Planes | `apps/api/prisma/seed.ts:16` y `:24` | F1 · F7 |
| Tarifa base y antigüedad máxima por aseguradora (RN-26) | ver 02 §10 | **Código** (tarifa de prueba en cada estrategia) | `apps/api/src/cotizacion/estrategia/estrategia-*.ts` | F3 |
| Factor por plan (Básico/Intermedio/Full) (D-10) | 0,75 / 1,00 / 1,35 | **Código** | función común de tarifa de prueba | F3 |
| Factor por uso y por antigüedad | ver 02 §10 | **Código** | función común de tarifa de prueba | F3 |
| Recargos propios (ubicación, clase/tipo) | ver 02 §10 | **Código** | `estrategia-pacifico.ts`, `estrategia-la-positiva.ts` | F3 |
| Minutos para considerar abandono (D-12) | 30 | Variable de entorno `MINUTOS_ABANDONO` en `apps/api/.env` | `.env.example` | F6 |
| Tiempo estimado de contacto (N13) | 30 min | Variable de entorno `MINUTOS_CONTACTO_ESTIMADO` | `.env.example` | F5 |
| Aviso «Simulación académica» en la UI | texto fijo | **Código** | `apps/web/src/componentes/AvisoSimulacion.tsx:5` | F0 |
| Leyenda del PDF «Documento de demostración sin validez legal» (RNF-20) | texto fijo | **Código** | generador de PDF simulado | F4 |
