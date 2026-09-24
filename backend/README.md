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
| GET | `/api/financiero/pagos` | cualquiera | Pagos registrados (filtros: `unidadId`, `desde`, `hasta`) |
| GET | `/api/financiero/pagos/:id` | cualquiera | Detalle de un pago con expensas aplicadas |
| POST | `/api/financiero/pagos` | ADMINISTRADOR | Registra un pago: aplica a expensas, caja/banco, anticipo y asiento |
| GET | `/api/financiero/categorias` | cualquiera | Categorías de ingreso/egreso (`?tipo=`) |
| GET/POST | `/api/financiero/ingresos` | cualq. / ADMIN | Ingresos extraordinarios (con asiento) |
| GET/POST | `/api/financiero/egresos` | cualq. / ADMIN | Egresos (valida saldo; con asiento) |
| GET | `/api/financiero/cuentas` | cualquiera | Cuentas de caja y bancos |
| GET | `/api/financiero/cuentas/:id/movimientos` | cualquiera | Libro de movimientos |
| GET | `/api/financiero/contabilidad/plan-cuentas` | cualquiera | Plan de cuentas (`?imputables=true`) |
| GET | `/api/financiero/contabilidad/asientos` | cualquiera | Libro diario (`desde`, `hasta`, `origenTipo`) |
| GET | `/api/financiero/contabilidad/asientos/:id` | cualquiera | Detalle de un asiento |
| GET | `/api/financiero/contabilidad/balance-comprobacion` | cualquiera | Sumas y saldos por cuenta (`desde`, `hasta`) |

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

### Registrar un pago

```json
POST /api/financiero/pagos
{ "unidadId": 3, "cuentaId": 1, "monto": 350, "metodo": "EFECTIVO", "referencia": "REC-0005", "cobrarMora": false }
```
El pago se aplica a las expensas pendientes de la unidad de la más antigua a la más reciente (mora primero si `cobrarMora`), el excedente queda como anticipo, y genera el movimiento de caja y el asiento contable en la misma transacción.

### Contabilidad (partida doble)

| Operación | Debe | Haber |
|---|---|---|
| Emisión de expensas | 1.1.03 Cuentas por Cobrar | 4.1.01 Ingresos por Expensas |
| Pago de expensas | 1.1.01 Caja / 1.1.02 Bancos | 1.1.03 Cuentas por Cobrar · 4.1.02 Ingresos por Mora · 2.1.01 Anticipos |
| Ingreso extraordinario | 1.1.01 Caja / 1.1.02 Bancos | 4.2.xx cuenta de la categoría |
| Egreso | 5.1.xx cuenta de la categoría | 1.1.01 Caja / 1.1.02 Bancos |

## Documentación y pruebas

- Colección Postman: `docs/NEXA-API.postman_collection.json` (el login guarda el token automáticamente).
- Pruebas unitarias: `npm test` (74 casos, runner nativo `node:test`, sin dependencias).

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
      controllers/ services/ utils/   ← expensas, periodos, pagos, ingresos/egresos, contabilidad
prisma/
  schema.prisma  seed.js  migrations/
tests/                        ← *.test.js
docs/                         ← Postman
```
