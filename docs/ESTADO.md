# Estado actual del SVAS

## Último checkpoint
2026-11-04 20:41 (Lima) · rama `feat/f1-modelo-datos` · último commit `f4946bb`

## Fase y paso actual
**F1 · Modelo de datos**: código y tests listos; en `cerrar-fase` (PR #2 + CI). F0 mergeada (PR #1). Alcance: F0 → F9.

## Qué funciona y cómo verlo
- `npm run db:reset` (o `npx prisma migrate deploy` + `npm run db:seed`): 5 aseguradoras, 15 planes, 28 campos, 143 valores, parámetros 5/10/4/7/12/7, 80 pólizas (AUTONOMO 23, ASESORIA 29, TELEMARKETING 28).
- Usuarios: admin@svas.demo/Admin123!, asesor1/2@svas.demo/Asesor123!, cliente@svas.demo/Cliente123! (póliza previa, DNI 70000001). Aún sin login (F2).
- `npm test`: 11 pruebas (salud + 10 de restricciones de BD).

## Siguiente paso exacto
Cerrar F1 (PR → CI → merge) y crear `feat/f2-seguridad`: `apps/api/src/seguridad/` (auth.controller, JWT, guards Roles/Propiedad), test endpoints × roles, web login.

## Decisiones Propuesta que esperan visto bueno
Ninguna. Nuevas Tomadas: D-44 (pruebas con migrate deploy), D-45 (6 reglas de trigger).

## Riesgos o deudas
- Prisma bloquea `migrate reset` cuando lo ejecuta un agente de IA: Denis sí puede usar `npm run db:reset`; las pruebas usan deploy + seed (D-44).
- PDF de las 80 pólizas históricas: no existen en disco; en F4 se regeneran si faltan.
- Windows real de Denis no verificado a mano (CI windows verde en F0).

## Estado del CI
F0: ubuntu ✅ · windows ✅. F1: pendiente.
