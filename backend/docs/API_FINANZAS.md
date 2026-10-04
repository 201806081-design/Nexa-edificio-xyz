# API · Módulo Finanzas (dashboard, morosos) — contrato para el frontend

Base: `{VITE_API_BASE_URL}/financiero` · Todas requieren `Authorization: Bearer <token>` (cualquier rol: son de lectura).
Respuesta siempre `{ ok: true, data: ... }`; errores `{ ok: false, error: '...' }`.

## GET /financiero/dashboard/finanzas?periodo=YYYY-MM

Reemplaza 1 a 1 a `frontend/src/constants/finanzasMock.js`. Si no se envía `periodo`, usa el último período emitido.

```json
{
  "periodoActual": "Octubre 2026",
  "periodos": ["Octubre 2026", "Septiembre 2026", "Agosto 2026"],
  "resumen": { "ingresos": 8500, "gastos": 3200, "balance": 5300, "saldoPendiente": 3700 },
  "ingresosGastos": [
    { "mes": "Jul", "ingresos": 6200, "gastos": 2800 },
    { "mes": "Ago", "ingresos": 7400, "gastos": 3100 },
    { "mes": "Sep", "ingresos": 9100, "gastos": 3600 },
    { "mes": "Oct", "ingresos": 8500, "gastos": 3200 }
  ],
  "estadoExpensas": [
    { "estado": "Pagadas",    "valor": 60, "color": "#2E9D78" },
    { "estado": "Pendientes", "valor": 25, "color": "#E8A33D" },
    { "estado": "Vencidas",   "valor": 15, "color": "#D64545" }
  ],
  "departamentosMora": [
    { "id": 4, "departamento": "Depto. 301", "estado": "Vencida", "monto": 357, "diasMora": 46, "responsable": "Ana Pérez" }
  ],
  "movimientos": [
    { "id": 12, "tipo": "ingreso", "monto": 1700, "descripcion": "Cobro de expensas", "fecha": "2026-10-15" },
    { "id": 11, "tipo": "egreso",  "monto": 2000, "descripcion": "Reparación del ascensor", "fecha": "2026-10-12" }
  ],
  "meta": { "periodo": "2026-10", "periodoId": 3, "rango": { "desde": "2026-10-01", "hasta": "2026-11-01" }, "generadoEn": "..." }
}
```

Reglas de negocio:
- `resumen.ingresos` / `gastos`: suma de movimientos de caja y bancos del mes seleccionado (ingresos = cobros de expensas + ingresos extraordinarios; gastos = egresos + planillas).
- `resumen.saldoPendiente`: total por cobrar acumulado (todas las expensas con saldo > 0).
- `estadoExpensas`: porcentajes de las expensas del período seleccionado; `Pendientes` incluye las pagadas parcialmente.
- `departamentosMora.monto` = saldo pendiente + mora estimada a hoy (mismo cálculo que el estado de cuenta).
- `movimientos`: los últimos 5 hasta el fin del período seleccionado.
- Para cambiar el período desde el selector: convertir "Septiembre 2026" → `2026-09` y volver a pedir.

## GET /financiero/morosos?minDias=1

Lista completa de unidades morosas con responsable de pago y detalle de expensas vencidas.

```json
{ "generadoEn": "...", "cantidad": 2, "montoTotal": 866.57,
  "items": [{ "unidad": { "id": 4, "codigo": "DPTO-301", "tipo": "DEPARTAMENTO", "piso": 3 },
              "responsable": { "id": 1, "nombre": "Ana Pérez", "telefono": "70000001", "email": "ana@nexa.bo" },
              "expensasVencidas": 2, "diasMoraMax": 46, "capital": 500, "mora": 9.57, "saldoTotal": 509.57,
              "expensas": [{ "id": 2, "periodo": "2026-08", "fechaVencimiento": "2026-08-10", "diasVencida": 46,
                             "saldoPendiente": 350, "moraEstimada": 9.57, "moraCobrada": 0, "estado": "VENCIDA" }] }] }
```

## GET /financiero/dashboard

Indicadores completos para la pantalla de inicio: `porCobrar {capital, mora, total, expensas}`, `morosos {cantidad, montoTotal}`,
`expensasPeriodo {total, pagadas, parciales, pendientes, vencidas}`, `cuentas {caja, bancos, total, detalle[]}`, `mes {ingresos, egresos, resultado}`.

## Ejemplo de consumo (reemplaza el import del mock)

```js
// frontend/src/services/finanzas.service.js
const BASE = import.meta.env.VITE_API_BASE_URL;

export async function obtenerFinanzas(periodo, token) {
  const q = periodo ? `?periodo=${periodo}` : '';
  const r = await fetch(`${BASE}/financiero/dashboard/finanzas${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await r.json();
  if (!r.ok || !json.ok) throw new Error(json.error || 'No se pudo cargar Finanzas');
  return json.data; // { periodoActual, periodos, resumen, ingresosGastos, estadoExpensas, departamentosMora, movimientos }
}

// 'Septiembre 2026' -> '2026-09'
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export function etiquetaAPeriodo(etiqueta) {
  const [mes, anio] = etiqueta.split(' ');
  return `${anio}-${String(MESES.indexOf(mes) + 1).padStart(2, '0')}`;
}
```
