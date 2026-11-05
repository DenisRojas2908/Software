---
name: retomar
description: Retoma el trabajo del SVAS al iniciar una sesión. Ubica la rama de fase vigente, lee docs/ESTADO.md, prepara dependencias y PostgreSQL (svas, svas_test), corre las pruebas y continúa con el siguiente paso. Úsala al comienzo de cada sesión.
---

# Retomar

1. `git fetch origin`.
2. Busca la rama de fase más reciente:
   `git for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:iso)' refs/remotes/origin/feat`.
   Si su último commit es más reciente que `origin/main` y no estás en ella: `git checkout <rama sin origin/>` (crea el seguimiento si hace falta) y `git pull`.
3. Lee `docs/ESTADO.md`, `git log --oneline -10` y `git status`. Si hay cambios sin commit, entiende de qué son antes de tocar nada.
4. Dependencias: si falta `node_modules` (o el hook de inicio no corrió), ejecuta `npm ci`.
5. PostgreSQL:
   - `pg_isready`. Si no responde: en la nube, `service postgresql start`. En Windows, pide a Denis que inicie el servicio «postgresql-x64-16».
   - En la nube, la clave de `postgres` es `postgres` (si falla el login: `su postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres'\""`).
   - Crea las bases que falten: `svas` y `svas_test` (`su postgres -c "createdb svas"` en la nube; `createdb -U postgres svas` en Windows).
   - Si `apps/api/.env` no existe, cópialo de `apps/api/.env.example` y ajusta la clave.
   - **Desde F1**: `npm run db:migrate` y `npm run db:seed` sobre `svas`; las pruebas preparan `svas_test` solas.
6. `npm test` (si ya existe `package.json`).
7. Resume en 3 líneas: fase y paso, estado de las pruebas, siguiente paso exacto. Luego continúa con ese paso (si ESTADO.md no dice que hay que esperar a Denis).
