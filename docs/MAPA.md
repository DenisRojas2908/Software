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
| Prisma | ORM: describe las tablas en `schema.prisma` y genera un cliente tipado (`prisma.poliza.findMany()`) | SQLAlchemy / el ORM de Django |
| Migración | Archivo SQL versionado que lleva la BD de un estado al siguiente (`prisma/migrations/*`) | Alembic / migraciones de Django |
| Trigger | Función de PostgreSQL que se ejecuta sola antes de un INSERT/UPDATE y puede rechazarlo | — (vive en la BD) |
| Seed | Script que llena la BD con datos de demo | Un `fixtures.py` / `loaddata` |
| Provider / inyección de dependencias | Nest crea los objetos (p. ej. `PrismaService`) y se los pasa al constructor de quien los pide | Pasar dependencias como parámetros del `__init__`, pero automático |
| JWT (token) | Texto firmado que el servidor entrega al iniciar sesión; el navegador lo manda en cada petición (`Authorization: Bearer …`). Expira | Una cookie de sesión firmada (itsdangerous) |
| Guard (Nest) | Clase que decide si una petición puede pasar antes de llegar al controlador (401/403) | Un decorador `@login_required` / una dependencia de FastAPI |
| Decorador propio (`@Roles('ADMINISTRADOR')`, `@Publico()`) | Marca una ruta con metadatos que luego lee el guard | Un decorador que agrega atributos a la función |
| Interface (TS) | Contrato de forma: qué campos/métodos debe tener un objeto; no genera código | `typing.Protocol` / una clase abstracta |
| Contexto de React (`ProveedorSesion`) | Valor compartido por toda la app sin pasarlo de mano en mano (aquí, el usuario logueado) | Una variable global, pero controlada |
| Hook (`useSesion`, `useState`, `useEffect`) | Función de React que da estado o efectos a un componente; empieza con `use` | — (estado de la página en Streamlit: `st.session_state`) |
| React Router (`<Route path="/admin">`) | Elige qué componente mostrar según la URL, sin recargar la página | Las rutas de Flask, pero en el navegador |
| zod (`z.object({...})`) | Esquema que valida datos y devuelve errores por campo; se usa en api y web | pydantic |
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

### F1 · Persistencia y datos
| Archivo | Qué hace | Requisito |
|---|---|---|
| `apps/api/prisma/schema.prisma` | Las 22 tablas y 16 enums; nombres en español (`Cotizacion`), tablas en snake_case (`@@map`) | 02 §9 |
| `prisma/migrations/*_init/migration.sql` | SQL generado por Prisma: tablas, enums, 25 FK, índices únicos | 02 §9, D-27 |
| `prisma/migrations/*_restricciones/migration.sql` | CHECK, índice parcial de pago confirmado, triggers T1–T6 y RLS | RN-07, RN-10, RN-11, RN-14, D-24 |
| `apps/api/prisma/seed.ts` | `sembrar()`: vacía las tablas y carga catálogo, parámetros, usuarios demo y 80 pólizas históricas | 02 §10, RNF-13 |
| `apps/api/src/persistencia/prisma.service.ts` | Cliente Prisma inyectable (conexión directa con `@prisma/adapter-pg`) | D-03, RNF-05 |
| `apps/api/test/soporte/*.js` | Antes de las pruebas: usa `svas_test`, aplica migraciones y recarga el seed | — |


### F2 · Seguridad
| Archivo | Qué hace | Requisito |
|---|---|---|
| `apps/api/src/seguridad/autenticacion.guard.ts` | Guard global: lee el JWT, exige sesión salvo `@Publico()`, y rechaza con 403 el rol no listado en `@Roles()` | RF-31, RF-32, RNF-10 |
| `apps/api/src/seguridad/decoradores.ts` | `@Publico()`, `@Roles(...)`, `@UsuarioActual()` | RF-32 |
| `apps/api/src/seguridad/propiedad.ts` | `verificarPropiedad()`: un CLIENTE solo accede a lo suyo; lo sin dueño (invitado) se lee por uuid | RF-32, D-36 |
| `apps/api/src/seguridad/auth.service.ts` | Registro mínimo de CLIENTE (+ Cliente), login con bcrypt, emisión del JWT con expiración, creación de usuarios internos | RF-11, RF-31, RNF-09 |
| `apps/api/src/administracion/usuarios.controller.ts` | Admin lista, crea (ASESOR/ADMINISTRADOR) y activa/desactiva usuarios, con RegistroActividad en la misma transacción | RF-31, RNF-12 |
| `apps/api/src/comun/reloj.ts` | Puerto `Reloj` (`RELOJ`): `RelojSistema` (con adelanto de días para la demo) y `RelojFijo` (pruebas) | D-07, D-38 |
| `apps/api/src/comun/registro-actividad.service.ts` | `registrar(accion, entidad, usuarioId, tx)` con fecha del Reloj | RNF-12 |
| `apps/api/src/comun/validacion.ts` | `validar(esquemaZod, body)` → 400 con `errores` por campo | RF-03, RNF-08 |
| `apps/api/test/soporte/endpoints.ts` | Inventario de endpoints protegidos con sus roles: lo recorre `permisos.e2e-spec.ts` | RNF-10 |
| `apps/web/src/api/cliente.ts` | `api(ruta, {cuerpo})`: llama a `/api`, agrega el token, convierte errores en `ErrorApi` con `errores` por campo | RNF-18 |
| `apps/web/src/sesion/sesion.tsx` | Contexto de sesión (`useSesion`): usuario, `iniciar`, `cerrar` | RF-31 |
| `apps/web/src/componentes/RutaProtegida.tsx` · `Encabezado.tsx` | Rutas y menú según rol (la protección real está en el backend) | RF-32 |
| `apps/web/src/pages/login/Login.tsx` | Ingresar / Crear cuenta (react-hook-form + zod), vuelve a `?volver=` | RF-11, CU-02 paso 2 |
