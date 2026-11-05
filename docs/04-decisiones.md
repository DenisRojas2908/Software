# 04 · Decisiones de construcción

Estados: **Tomada** (ya decidida; respetar) · **Propuesta** (default razonable; se puede cambiar si Denis lo pide) · **Pendiente** (preguntar a Denis al iniciar).
Cuando Claude Code tome una decisión nueva, la agrega aquí con el mismo formato.

| ID | Decisión | Estado | Por qué / cómo defenderla |
|---|---|---|---|
| D-01 | **Monolito modular**: un backend NestJS; en build sirve también la SPA → un proceso, una URL. En desarrollo, Vite con proxy | Tomada | El diagrama de paquetes ya dice "monolito modular". Se mantiene el diseño lógico (SPA + API REST, capas, módulos); solo se simplifica el físico porque el sistema se presenta una vez |
| D-02 | Backend **NestJS + TypeScript**, no Spring Boot | Tomada | Es lo que dice el diseño (PC2), posterior al análisis (PC1). Un solo lenguaje en front y back |
| D-03 | **Prisma con conexión directa a PostgreSQL** (Supabase), no supabase-js | Tomada | RNF-05 exige que pago, emisión y póliza sean atómicos; supabase-js va por PostgREST y cada llamada es su propia transacción |
| D-04 | **Jest** en api (con Supertest) y en web | Tomada | Es el estándar de NestJS. Los documentos dicen "JUnit" para el backend (RNF-10, RNF-16): corregir esa palabra en el consolidado |
| D-05 | PDF con **pdfkit**, guardado en `storage/polizas/` (ruta en `archivo_pdf`) detrás del puerto `GeneradorPdf` | Tomada | Simple y local. El diseño físico mencionaba Supabase Storage: es otra implementación del mismo puerto si hiciera falta |
| D-06 | Mensajería (llamada, WhatsApp, mensaje final) **simulada** con el puerto `Notificador`; los mensajes se ven en un buzón de demo | Tomada | El contacto es humano y fuera del sistema (decisión de diseño de CU-03/CU-04); el sistema solo registra y envía el enlace |
| D-07 | Puerto **`Reloj`** con implementación del sistema y simulada (adelantar días en modo demo) | Tomada | Permite mostrar "4 intentos en 7 días" y "enlace vencido" en vivo y probarlo sin esperar |
| D-08 | Pago simulado **sin datos de tarjeta**: botón "Pagar (simulado)"; el rechazo se fuerza desde el panel de demo | Tomada | Límite declarado: no hay cobros reales. Evita manejar datos sensibles |
| D-09 | La estrategia recibe el plan: `cotizar(datos, plan): number \| null` | Propuesta | La prima se guarda por plan (`PrimaCotizada`), así que la estrategia necesita saber qué plan cotiza. Es una ampliación de la firma del diagrama de clases |
| D-10 | El factor de cada plan (Básico/Intermedio/Full) vive **dentro de la estrategia**, por nombre de plan; plan sin factor → no cotiza | Propuesta | No cambia el modelo (Plan no tiene precio). Alternativa: agregar `factor_tarifa` a `plan` |
| D-11 | Campo nuevo creado por el admin sin columna propia: su valor se guarda en `vehiculo.datos_adicionales jsonb` (default `{}`) | Pendiente | Sin esto, RNF-13 ("un campo nuevo es solo configuración") no se cumple de verdad. Toca el diseño físico (sección 3.5): confirmar con Denis. Alternativa sin tocar el modelo: el admin solo edita obligatoriedad y valores permitidos de los campos existentes |
| D-12 | Abandono: cotización REGISTRADA sin pago confirmado ni asesoría abierta tras `MINUTOS_ABANDONO` (env, 30) → NO_CONCRETADA + Seguimiento. Job cada minuto + botón de demo | Propuesta | Los CU dicen "si no compra, pasa a seguimiento" pero no cuándo. 30 min viene del AS-IS (el asesor llama ~30 min después) |
| D-13 | `maxCuotas` inicial = 12; cuotas iguales **sin recargo**; la pasarela confirma la cuota 1 y deja el resto PENDIENTE | Propuesta | RN-14 no da valor inicial. Recargo financiero queda fuera de la simulación |
| D-14 | Fuera de nicho si `clase` ∈ {CAMION, BUS, REMOLCADOR} o si el cliente supera 2 vehículos particulares / 5 comerciales | Propuesta | RN-05 nombra pesados, carga y flotas, pero el enum de uso no los incluye |
| D-15 | Correo **opcional** al cotizar; obligatorio al crear la cuenta | Propuesta | RN-04 y RF-06: el derivado se atiende "sin pedir un correo"; el contacto es por teléfono/WhatsApp |
| D-16 | Registro único: `Cliente` se reutiliza por correo o teléfono; `Vehiculo` por (cliente, uso, marca, modelo, año). Al registrarse o iniciar sesión se vincula usuario ↔ cliente; si el usuario ya tenía otro cliente, el vehículo de la cotización pasa a ese cliente | Propuesta | RF-07 + "la cotización de invitado se asocia a la cuenta al registrarse" (ficha y CU-02 paso 2) |
| D-17 | `cotizacion_opcion` guarda la **unión** de opciones; la habilitación de la Opción 1 se calcula **por plan** con la misma función de dominio | Propuesta | Resuelve que la inspección sea por aseguradora y uso (RN-25) mientras el modelo guarda las opciones por cotización |
| D-18 | `numero_documento` se pide al comprar (datos faltantes) y ahí se evalúa la primera compra | Tomada | Así lo dijo el diseño físico (documento nulo hasta el pago) y es coherente con RNF-08 |
| D-19 | Marca "SVAS"; sin logo ni estética de SeguroSimple.com; aseguradoras solo por nombre; aviso de simulación en UI y PDF | Tomada | Es un trabajo académico: no debe parecer el sitio real ni documentos reales de las aseguradoras |
| D-20 | Tarifas, planes, DNI y personas del seed son **ficticios** | Tomada | RN-26: tarifas de prueba. Se dice así en la sustentación |
| D-21 | Despliegue por defecto: local para la demo; si piden URL pública, un servicio en Railway + Supabase (pooler en modo sesión, IPv4) | Pendiente | El diseño 4.1 dice Vercel + Railway + Supabase; el código soporta ambas variantes (CORS y `VITE_API_URL` por variable) |
| D-22 | BD de desarrollo y pruebas | Pendiente | Con Docker Desktop: Postgres local (dev y test) y Supabase solo para el despliegue. Sin Docker: dos bases en Supabase (dev y test) o un Postgres instalado en Windows |
| D-23 | ¿Otros integrantes escriben código? | Pendiente | Si sí: PR obligatorio a `main` y un módulo por persona (ayuda a que cada uno lo sustente). Si no: ramas por fase igual, para mostrar gestión de configuración |
| D-24 | ¿Hay DDL / PPT de la sección 3.5, 4.1 y 4.2? | Pendiente | Si existe, copiarlo a `docs/fuentes/` y que el esquema lo siga al pie de la letra (incluye los 2 triggers que no se conocen) |
