# SVAS — Simulación del Sistema de Venta Autónoma de Seguros

Proyecto académico (SI707V Ingeniería de Software, UNI-FIIS 2026-2, Grupo 4). **Simulación**: no hay cobros ni pólizas reales.

## Requisitos (Windows)
- Node.js ≥ 20.19 (recomendado 22 LTS) y npm ≥ 10
- Git
- PostgreSQL 16 instalado localmente (D-22). Durante la instalación anota la clave del usuario `postgres`.

## Primera vez (PowerShell)
```powershell
git clone https://github.com/DenisRojas2908/Software.git C:\dev\svas   # fuera de OneDrive
cd C:\dev\svas
npm install
Copy-Item apps\api\.env.example apps\api\.env      # luego edita la clave de postgres
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres svas
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres svas_test
npm run db:reset                                   # migraciones + datos de demo (desde F1)
```

## Uso diario
| Comando | Qué hace |
|---|---|
| `npm run dev` | API en http://localhost:3000/api y web en http://localhost:5173 (con recarga automática) |
| `npm test` | Pruebas de api y web |
| `npm run lint` | Revisión de estilo |
| `npm run build` y luego `npm start` | Versión de demo: un solo proceso en http://localhost:3000 |
| `npm run db:migrate` · `npm run db:seed` · `npm run db:reset` | Base de datos |

## Documentación
- `CLAUDE.md`: reglas del proyecto · `docs/ESTADO.md`: dónde vamos · `docs/MAPA.md`: el código explicado
- `docs/02-especificacion.md`: requisitos y reglas · `docs/04-decisiones.md`: decisiones
- `docs/trazabilidad.md` · `docs/sustentacion.md` · `docs/COMO_CAMBIAR.md`
