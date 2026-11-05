# Mapa del código SVAS

Para quien sabe Python y pandas pero no TypeScript, NestJS ni React. Cada concepto nuevo se explica **una vez**, en la primera aparición, con su equivalente en Python si existe. Se actualiza cuando cambia la estructura.

> **Estado**: F0 sin código todavía. Abajo está la estructura **planificada** (CLAUDE.md › Arquitectura). Cada módulo pasa a la sección «Módulos implementados» cuando existe.

## Cómo está organizado el repo
| Carpeta | Qué es | Equivalente en Python |
|---|---|---|
| `apps/api` | Backend NestJS (API REST + reglas de negocio) | Un proyecto FastAPI/Django |
| `apps/web` | Frontend React (lo que ve el usuario en el navegador) | — (en Python no hay equivalente directo; sería como Streamlit, pero corre en el navegador) |
| `package.json` raíz | Declara los dos proyectos (*workspaces*) y los comandos `npm run …` | `pyproject.toml` + un `Makefile` |

## Módulos planificados del backend (`apps/api/src`)
| Módulo | Responsabilidad | RF/RN principales | Fase |
|---|---|---|---|
| `persistencia/` | Conexión a PostgreSQL con Prisma | RNF-05 | F1 |
| `comun/` | Salud, Reloj, RegistroActividad, errores | RNF-12 | F0/F3 |
| `seguridad/` | Login, registro, JWT, guards de rol y propiedad | RF-31, RF-32, RNF-09, RNF-10 | F2 |
| `dominio-compartido/` | Catálogo (aseguradoras, planes, campos, reglas) y cliente/vehículo | RF-02, RF-07, RN-16, RN-17 | F3 |
| `cotizacion/` | Cotizar, estrategias por aseguradora, derivación | RF-01…RF-10, RN-01…RN-05, RN-18…RN-26 | F3 |
| `compra/` | Opción 1: orden, firma simulada, descuentos, canal | RF-09, RF-20, RF-24, RN-06…RN-09, RN-27 | F4 |
| `pagos/` | Pago único o en cuotas | RF-23, RN-14 | F4 |
| `polizas/` | Emisión, PDF, consulta de estado | RF-22, RF-25, RF-26, RN-15 | F4 |
| `asesoria-retencion/` | Cola de asesoría y seguimiento | RF-11…RF-21, RN-07, RN-10…RN-13 | F5/F6 |
| `administracion/` | Catálogo, parámetros, usuarios, reportes | RF-27…RF-30 | F7 |
| `integracion/` | Interfaces + simulaciones: pasarela, aseguradora, pdf, notificador | RNF-15, RN-26 | F4/F6 |

## Glosario (se llena a medida que aparece cada concepto en el código)
| Concepto | Qué es, en una línea | En Python |
|---|---|---|
| — | — | — |

## Módulos implementados
_(vacío hasta F0 paso 2)_
