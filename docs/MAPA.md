# Mapa del código SVAS

Para quien sabe Python y pandas pero no TypeScript, NestJS ni React. Cada concepto nuevo se explica **una vez**, en la primera aparición, con su equivalente en Python si existe. Se actualiza cuando cambia la estructura.

> **Estado**: F0 terminada (esqueleto). Los módulos planificados pasan a «Módulos implementados» cuando existen.

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
| TypeScript | JavaScript con tipos que se revisan al compilar (`x: number`). Se compila a JS | *type hints* de Python, pero obligatorios y verificados |
| `import { A } from './b'` | Trae `A` del archivo `b.ts` | `from b import A` |
| Workspace (npm) | Un repo con varios proyectos (`apps/api`, `apps/web`) que comparten `node_modules` | Un monorepo con varios paquetes en un `pyproject` |
| Decorador `@Algo()` | Anotación que agrega comportamiento a una clase o método (Nest las usa para rutas y módulos) | Decoradores de Python (`@app.get('/x')` en FastAPI) |
| Módulo de Nest (`@Module`) | Agrupa controladores y servicios de una funcionalidad; se registran en `AppModule` | Un *router* de FastAPI / una app de Django |
| Controller (`@Controller('salud')` + `@Get()`) | Clase cuyos métodos responden rutas HTTP | Funciones de ruta de FastAPI |
| `async`/`await` y `Promise` | Operación que termina después (BD, red); `await` espera su resultado | `async def` / `await` de asyncio |
| Componente React | Función que devuelve la interfaz (HTML) a mostrar | Una función que arma una página (como en Streamlit) |
| JSX (`<h1>SVAS</h1>` dentro de TS) | Sintaxis para escribir HTML dentro del código; se convierte a llamadas JS | f-strings que generan HTML, pero verificadas |
| `className="text-xs …"` (Tailwind) | Clases utilitarias de estilo: cada una aplica una propiedad CSS | — |
| `describe` / `it` / `expect` (Jest) | Agrupa pruebas, define una prueba y verifica un resultado | `class TestX` / `def test_…` / `assert` de pytest |

## Módulos implementados
### F0 · Esqueleto
| Archivo | Qué hace | Requisito |
|---|---|---|
| `apps/api/src/main.ts` | Arranca el servidor: lee `.env`, crea la app y escucha en `PORT` (3000) | D-01 |
| `apps/api/src/app.ts` | `crearApp()` / `configurarApp()`: prefijo `/api`. Lo usan `main.ts` y los tests, para que prueben lo mismo que se despliega | RNF-18 |
| `apps/api/src/app.module.ts` | Módulo raíz: registra los módulos y, si existe `apps/web/dist`, sirve la web (un proceso, una URL) | D-01 |
| `apps/api/src/comun/salud.controller.ts` | `GET /api/salud` → `{estado:'ok', simulacion:true, demoHabilitado}` | F0, F8 |
| `apps/api/prisma/schema.prisma` · `prisma.config.ts` | Esquema de la BD (modelos desde F1) y la URL de conexión (sale de `DATABASE_URL`) | D-03 |
| `apps/web/src/main.tsx` | Punto de entrada de la web: monta `<App/>` en el HTML | — |
| `apps/web/src/App.tsx` | Estructura general: aviso de simulación + página | D-19 |
| `apps/web/src/componentes/AvisoSimulacion.tsx` | Franja «Simulación académica» visible en toda la UI | D-19, RNF-20 |
| `apps/web/vite.config.mts` | Servidor de desarrollo (:5173), reenvía `/api` a Nest (:3000) | — |
| `.github/workflows/ci.yml` | CI: Ubuntu (Postgres, lint, test, build) y Windows (install, build, test) | D-42 |

