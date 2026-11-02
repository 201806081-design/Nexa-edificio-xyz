# API · Nómina: salarios, anticipos y bonos (HU-AP-01 · SCRUM-107) — contrato para frontend y QA

Base `{VITE_API_BASE_URL}/nomina` · `Authorization: Bearer <token>` · escrituras: ADMINISTRADOR.
Respuestas `{ ok: true, data }`; errores `{ ok: false, error }`.
El alta y edición de empleados es del módulo `personal` (Diego); aquí solo se leen.

## Flujo del mes
1. (Opcional) `POST /anticipos` cuando un empleado pide dinero a cuenta: sale de caja/banco y queda **pendiente de descontar**.
2. `POST /planillas/generar { anio, mes }` crea una planilla en **BORRADOR** por empleado activo, descontando automáticamente sus anticipos pendientes.
3. `PUT /planillas/:id { bonos, descuentos }` agrega conceptos mientras es borrador.
4. `POST /planillas/:id/pagar { cuentaId }` paga el neto desde caja/banco, marca los anticipos como descontados y asienta en contabilidad.

Fórmula: **bruto = salario base + bonos − descuentos** (gasto del mes) · **neto = bruto − anticipos** (lo que se paga).

## Empleados
- `GET /empleados?activos=true` → `[ { id, nombre, etiqueta: "Juan Mamani Choque -- Portero", cargo, ci, salarioBase, fechaIngreso, activo, anticiposPendientes, montoAnticiposPendientes, ultimaPlanilla: { periodo, estado, neto, fechaPago } } ]`
- `GET /empleados/:id/historial?anio=2026` (pantalla **Historial de pagos de empleados**)
  ```json
  { "empleado": { "id": 1, "nombre": "Juan Mamani Choque", "cargo": "Portero", "salarioBase": 2500 },
    "periodoConsultado": "Todo el historial",
    "resumen": { "cantidad": 2, "pagadas": 1, "borradores": 1, "totalBruto": 5250.5, "totalAnticipos": 500, "totalNeto": 4750.5, "netoPagado": 2125.25, "netoPendiente": 2625.25, "anticiposPendientes": 0, "montoAnticiposPendientes": 0 },
    "planillas": [ { "id": 7, "periodo": "Noviembre 2026", "salarioBase": 2500, "totalBonos": 250.5, "totalDescuentos": 125.25, "totalAnticipos": 500, "bruto": 2625.25, "neto": 2125.25, "estado": "PAGADA", "estadoUI": "Pagada", "fechaPago": "30/11/2026", "cuenta": "Caja General", "detalles": [ { "tipo": "BONO", "concepto": "Puntualidad", "monto": 200 } ] } ],
    "anticipos": [ { "id": 3, "fecha": "05/11/2026", "monto": 500, "estado": "Descontado", "planilla": "Noviembre 2026" } ] }
  ```

## Anticipos
- `POST /anticipos` `{ "empleadoId": 1, "cuentaId": 1, "monto": 500, "fecha": "2026-11-05", "observacion": "emergencia" }` → 201 con `movimientoId`, `asientoId`, `saldoCuenta`. 422 si la cuenta no tiene saldo; 422 si el empleado no está activo.
  Asiento: Debe **1.1.05 Anticipos a Empleados** / Haber Caja o Bancos. (La cuenta 1.1.05 se crea sola la primera vez.)
- `GET /anticipos?empleadoId=1&pendientes=true` → `[ { id, empleado, fecha, monto, descontado, estado: "Pendiente"|"En planilla"|"Descontado", planilla } ]`

## Planillas (pantalla **Planilla de personal**)
- `GET /planillas?anio=2026&mes=11&estado=BORRADOR|PAGADA&empleadoId=` → `{ resumen: { cantidad, pagadas, borradores, totalBruto, totalAnticipos, totalNeto, netoPagado, netoPendiente }, data: [ fila ] }`
- `POST /planillas/generar` `{ "anio": 2026, "mes": 11, "descontarAnticipos": true }` → 201 `{ periodo, generadas, yaExistentes, empleadosActivos, resumen, planillas }`. 409 si todos ya tienen planilla.
- `POST /planillas` `{ "empleadoId": 1, "anio": 2026, "mes": 11, "bonos": [ { "concepto": "Puntualidad", "monto": 200 } ], "descuentos": [ { "concepto": "Falta 10/11", "monto": 125.25 } ], "descontarAnticipos": true }` → 201 fila. 409 si ya existe.
- `GET /planillas/:id` → fila + `movimiento` + `anticipos` descontados.
- `PUT /planillas/:id` `{ "bonos": [...], "descuentos": [...], "descontarAnticipos": true|false }` → solo BORRADOR (409 si está pagada). Reemplaza los conceptos enviados; los que no se envían se conservan.
- `POST /planillas/:id/pagar` `{ "cuentaId": 1, "fecha": "2026-11-30" }` → `{ ...fila, estado: "PAGADA", asientoId, saldoCuenta }`. 409 si ya estaba pagada; 422 si la cuenta no alcanza.
  Asiento: Debe **5.1.04 Sueldos y Salarios** (bruto) / Haber **1.1.05 Anticipos a Empleados** (descontados) / Haber Caja o Bancos (neto). Movimiento de caja con `origenTipo: NOMINA`.
- `DELETE /planillas/:id` → solo BORRADOR; libera los anticipos reservados.

## Validaciones (400/409/422)
- `bonos[i].concepto` 1–150 caracteres, `monto > 0`; `descuentos` igual.
- Descuentos mayores al bruto → 422; anticipos pendientes mayores al líquido → 422 (generar con `descontarAnticipos: false` y descontar en otro mes).
- Una planilla por empleado y mes (única `empleadoId + anio + mes`).

## Contabilidad
Todo pasa por `registrarMovimiento` (libro de caja con bloqueo de fila) y `asentar` (partida doble): el balance de comprobación sigue cuadrando tras anticipos y pagos de planilla.
