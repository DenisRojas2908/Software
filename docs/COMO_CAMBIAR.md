# Cómo cambiar parámetros y textos

Para cada valor de negocio o texto visible: ¿se cambia **desde el panel de admin sin tocar código** (CU-05, RNF-13) o **en el código**? Archivo y línea se completan cuando el código existe.

> Los valores de negocio solo viven en el seed (RNF-13). Cambiar el seed afecta solo a una BD nueva (`npm run db:reset`); en una BD en uso se cambian desde el admin (F7).

| Valor / texto | Valor inicial | ¿Cómo se cambia? | Dónde (archivo:línea) | Fase |
|---|---|---|---|---|
| Descuento por primera compra (RN-08) | 5 % | **Admin → Parámetros** (sin código) | Valor inicial: `apps/api/prisma/seed.ts:8` | F1 (seed) · F7 (pantalla) |
| Descuento máximo de negociación (RN-07) | 10 % | **Admin → Parámetros** | `apps/api/prisma/seed.ts:9` | ✅ F7: /admin → pestaña indicada |
| Máximo de intentos de seguimiento (RN-10) | 4 | **Admin → Parámetros** | `apps/api/prisma/seed.ts:10` | ✅ F7: /admin → pestaña indicada |
| Días de seguimiento (RN-10) | 7 | **Admin → Parámetros** | `apps/api/prisma/seed.ts:11` | ✅ F7: /admin → pestaña indicada |
| Vigencia del enlace de retoma (RN-12) | 7 días | **Admin → Parámetros** | `apps/api/prisma/seed.ts:13` | ✅ F7: /admin → pestaña indicada |
| Máximo de cuotas (RN-14) | 12 | **Admin → Parámetros** | `apps/api/prisma/seed.ts:12` | ✅ F7: /admin → pestaña indicada |
| Inspección por aseguradora × uso (RN-25) | TRANSPORTE_PASAJEROS = sí | **Admin → Inspección** (casilla por aseguradora × uso) | `apps/api/prisma/seed.ts:157` | ✅ F7: /admin → pestaña indicada |
| Campos requeridos y valores permitidos (RN-17…RN-23) | ver 02 §10 | **Admin → Campos** (obligatorio, activo, valores; «Agregar campo» crea uno nuevo, D-11) | `apps/api/prisma/seed.ts:92` (campos) y `:44-60` (valores) | ✅ F7: /admin → pestaña indicada |
| Activar/desactivar aseguradora o plan (RN-16) | todas activas | **Admin → Aseguradoras y planes** (casillas) | `apps/api/prisma/seed.ts:16` y `:24` | ✅ F7: /admin → pestaña indicada |
| Tarifa base y antigüedad máxima por aseguradora (RN-26) | ver 02 §10 | **Código** (tarifa de prueba de la aseguradora simulada) | `apps/api/src/cotizacion/estrategia/estrategias.ts:28` (Rímac), `:35` (Pacífico), `:45` (La Positiva), `:57` (Mapfre), `:64` (Quálitas) | F3 |
| Factor por plan (Básico/Intermedio/Full) (D-10) | 0,75 / 1,00 / 1,35 | **Código** | `apps/api/src/cotizacion/estrategia/tarifa-prueba.ts:9` | F3 |
| Factor por uso y por antigüedad | ver 02 §10 | **Código** | `apps/api/src/cotizacion/estrategia/tarifa-prueba.ts:11` (uso) y `:17` (antigüedad) | F3 |
| Recargos propios (ubicación, clase/tipo) | ver 02 §10 | **Código** | `apps/api/src/cotizacion/estrategia/estrategias.ts:37` (Pacífico), `:47` (La Positiva) | F3 |
| Minutos para considerar abandono (D-12) | 30 | Variable de entorno `MINUTOS_ABANDONO` en `apps/api/.env` | `.env.example` | F6 |
| Tiempo estimado de contacto (N13) | 30 min | Variable de entorno `MINUTOS_CONTACTO_ESTIMADO` | `.env.example` | F5 |
| Aviso «Simulación académica» en la UI | texto fijo | **Código** | `apps/web/src/componentes/AvisoSimulacion.tsx:5` | F0 |
| Leyenda del PDF «Documento de demostración sin validez legal» (RNF-20) | texto fijo | **Código** | `apps/api/src/integracion/pdf/generador-pdf.ts:4` (`LEYENDA_DEMO`); diseño del PDF en `generador-pdfkit.ts` | F4 |
| Límites de nicho (RN-05): 2 particulares, 5 comerciales/pasajeros; clases fuera (camión, bus, remolcador) | ver RN-05, D-39 | **Código** (definen el alcance del producto, no son parámetros comerciales) | `apps/api/src/cotizacion/dominio/evaluar-nicho.ts:5-6` | F3 |
| Mensajes de derivación (inspección / no asegurable) | texto | **Código** | `apps/api/src/cotizacion/cotizacion.service.ts` (`MENSAJE_DERIVACION`) | F3 |
| Etiquetas de campos y valores en la UI | texto | **Código** | `apps/web/src/componentes/formato.ts` | F3 |
| Aseguradoras y planes que aparecen en el comparativo | catálogo | **Admin → Aseguradoras y planes** (sin código) | BD | F7 |
| Forzar pago rechazado / emisión fallida (demo) | apagado | Panel de demo (F8) | `apps/api/src/integracion/simulacion/simulador-fallos.ts` | F4 · F8 |
| Texto «Pago simulado: no se solicitan datos de tarjeta…» | texto fijo | **Código** | `apps/web/src/pages/pago-poliza/PagoPoliza.tsx` | F4 |
| Vigencia mostrada de la póliza (12 meses) | 12 meses (02 §7) | **Código** | `apps/api/src/polizas/poliza.service.ts` (`vigenciaHasta`) | F4 |
| Carpeta donde se guardan los PDF | `apps/api/storage/` | Variable de entorno `STORAGE_DIR` | `apps/api/src/integracion/pdf/generador-pdfkit.ts` | F4 |
| Textos del mensaje final y del enlace de retoma | texto | **Código** | `apps/api/src/asesoria-retencion/retencion/retencion.service.ts` (`avisar`) | F6 |
| Frecuencia del job de abandonos/cierres (1 min) y apagarlo | 60 s | Variable `JOB_SEGUIMIENTO=false` lo apaga; el intervalo está en código | `retencion.service.ts` (`onModuleInit`) | F6 |
| Usuarios asesores y administradores | seed | **Admin → Usuarios** (crear, activar/desactivar) | BD | F7 |
