# NEXA · Backend (API)

API del Sistema Integral de Administración del Edificio XYZ.
Stack: Node.js 20 · Express · Prisma 6 · PostgreSQL · JWT.

## Módulos

| Carpeta `src/modules/` | Responsable | Estado |
|---|---|---|
| `auth` | Seguridad (Diego) · soporte Backend Financiero | Login JWT + middleware de roles |
| `financiero` | Backend Financiero (Juan Luis) | Expensas, periodos, estado de cuenta, caja/bancos |
| `copropietarios`, `personal`, `comunicados`, `documentos`, `auditoria` | Backend Operativo (Diego) | Pendientes |

El esquema de base de datos es único y compartido: `prisma/schema.prisma`.

## Arranque local

```bash
cd backend
npm install
cp .env.example .env            # completa DATABASE_URL y JWT_SECRET
npx prisma migrate dev --name init
npm run db:seed
npm test                        # pruebas unitarias (no requieren BD)
npm run dev                     # http://localhost:8000
```

Usuarios de prueba (coinciden con el frontend): `usuario1`, `usuario2`, `usuario3` · contraseña `1234`
(Administrador, Directorio y Consulta respectivamente).

## Endpoints

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/api/health` | público | Estado del servicio y de la BD |
| POST | `/api/auth/login` | público | `{ usuario, password }` → `{ token, user }` |
| GET | `/api/auth/me` | cualquiera | Perfil del token |
| GET | `/api/financiero/expensas` | cualquiera | Filtros: `estado`, `unidadId`, `anio`, `mes` |
| GET | `/api/financiero/expensas/resumen` | cualquiera | Totales por estado |
| GET | `/api/financiero/expensas/:id` | cualquiera | Detalle con pagos aplicados |
| GET | `/api/financiero/periodos` | cualquiera | Periodos con totales |
| POST | `/api/financiero/periodos` | ADMINISTRADOR | Genera las expensas del mes para todas las unidades |
| GET | `/api/financiero/unidades` | cualquiera | Unidades con ocupantes actuales |
| GET | `/api/financiero/unidades/:id/estado-cuenta` | cualquiera | Expensas, pagos, mora estimada y saldo |
| GET | `/api/financiero/cuentas` | cualquiera | Cuentas de caja y bancos |
| GET | `/api/financiero/cuentas/:id/movimientos` | cualquiera | Libro de movimientos |

Todas las rutas de `/api/financiero` requieren `Authorization: Bearer <token>`.

### Generar un periodo

```json
POST /api/financiero/periodos
{ "anio": 2026, "mes": 10, "modo": "FIJO", "montoBase": 350, "montosPorTipo": { "PARQUEO": 50, "BAULERA": 20 } }
```
o prorrateando un presupuesto por alícuota:
```json
{ "anio": 2026, "mes": 11, "modo": "COEFICIENTE", "presupuestoTotal": 12000 }
```

## Documentación y pruebas

- Colección Postman: `docs/NEXA-API.postman_collection.json` (el login guarda el token automáticamente).
- Pruebas unitarias: `npm test` (runner nativo `node:test`, sin dependencias).

## Estructura

```
src/
  index.js                    ← entrada (Dockerfile: node src/index.js)
  app.js                      ← Express, CORS, rutas, manejo de errores
  config/                     ← env.js, prisma.js
  shared/
    errors.js                 ← HttpError
    constants/roles.js        ← enum BD ↔ etiqueta frontend
    middlewares/              ← autenticar, autorizar, errores
  modules/
    auth/                     ← login, me
    financiero/
      controllers/ services/ utils/
prisma/
  schema.prisma  seed.js  migrations/
tests/                        ← *.test.js
docs/                         ← Postman
```
