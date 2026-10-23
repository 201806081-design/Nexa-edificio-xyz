# API · Generación en bloques, agua por departamento, estado de cuenta y movimientos (Semanas 8–9 · US2.2 / US2.3 / pizarra 22-oct)

Base `{VITE_API_BASE_URL}/financiero` · `Authorization: Bearer <token>` · escrituras: ADMINISTRADOR.

## 1. Generar expensas en bloques por categoría (pizarra: "monto fijo por tipo de depto, en bloques")

Cada departamento tiene `categoria` (A, B, C…). Parqueos y bauleras no tienen categoría: se les asigna monto por `montosPorTipo`.

- `POST /periodos/vista-previa` y `POST /periodos` aceptan:
  ```json
  { "anio": 2026, "mes": 11, "modo": "FIJO",
    "montosPorCategoria": { "A": 300, "B": 350 },
    "montosPorTipo": { "PARQUEO": 80, "BAULERA": 40 },
    "categorias": ["A"] }
  ```
  `categorias` limita la generación a ese bloque. **Primero** `["A"]`, **después** `["B"]`; sin `categorias` genera todo lo que falte.
- El periodo se crea en el primer bloque y se reutiliza en los siguientes; una unidad nunca se genera dos veces (409 si el bloque ya está completo).
- Cada bloque genera su asiento de devengado (Cuentas por cobrar / Ingresos por expensas).
- Respuesta de `POST /periodos`: `{ periodo, periodoNuevo, bloque, expensasGeneradas, totalEmitido, asientoId, yaExistentes, acumulado, unidadesActivas, omitidas }`.
- `GET /periodos` → cada periodo con `etiqueta`, `cantidadExpensas`, `unidadesActivas`, `completo`, `totalEmitido`, `totalAgua`, `saldoPendiente`.
- Prioridad de montos en modo FIJO: `montosPorCategoria[categoria]` → `montosPorTipo[tipo]` → `montoBase`.

## 2. Registrar monto de agua, departamento por departamento (pizarra: "uno por uno")

La expensa guarda el **monto total** (`monto` = fijo + agua), `montoAgua` y, opcional, `consumoM3`.

- `GET /periodos/:id/agua` → `{ periodo, totales: { unidades, conAgua, sinAgua, totalFijo, totalAgua, totalMensual },
  unidades: [ { expensaId, unidadId, departamento, categoria, montoFijo, montoAgua, consumoM3, montoTotal, saldoPendiente, estado, aguaRegistrada } ] }`
- `PUT /periodos/:id/agua/:unidadId` con `{ "monto": 35, "consumoM3": 12.5 }` → reemplaza el agua de esa unidad (no suma), recalcula total y saldo, asienta la diferencia. 404 si la unidad aún no tiene expensa en el periodo; 409 si el periodo está cerrado; 422 si se reduce por debajo de lo ya pagado.
- `GET /expensas` y el estado de cuenta ahora traen `montoFijo`, `montoAgua`, `consumoM3` por fila.

## 3. Estado de cuenta en la forma de la pantalla (US2.2)

`GET /estado-cuenta/:unidadId?anio=2026&mes=10` (sin anio/mes: todo el historial)
```json
{ "departamento": "Depto. 301", "responsable": "Lucía Vargas Soto -- Inquilino", "periodoConsultado": "Todo el historial",
  "resumen": { "totalGenerado": 735, "totalPagado": 550, "saldoPendiente": 185, "interesEstimado": 3.2, "totalConInteres": 188.2, "totalAgua": 35, "saldoAFavor": 0 },
  "expensas": [ { "periodo": "Octubre 2026", "montoFijo": 350, "montoAgua": 35, "monto": 385, "pagado": 200, "saldo": 185, "moraEstimada": 3.2, "estado": "Vencido" } ],
  "pagos":    [ { "fecha": "04/10/2026", "periodo": "Octubre 2026", "montoPagado": 200, "capital": 200, "mora": 0, "anticipo": 0, "metodo": "QR", "saldoRestante": 185 } ] }
```
`GET /unidades/selector` → `[ { id, departamento, etiqueta: "Depto. 301 -- Tipo B -- Piso 3", responsable, categoria, expensaMensual } ]` para los selectores.

## 4. Ingresos y gastos en la forma de la pantalla (US2.3)

`GET /movimientos?anio=2026&mes=10&tipo=Todos|Ingreso|Gasto&categoriaId=`
```json
{ "periodo": "Octubre 2026", "resumen": { "totalIngresos": 1335, "totalGastos": 7950, "balance": -6615 },
  "categorias": [ { "id": 5, "nombre": "Mantenimiento", "tipo": "Gasto" } ],
  "data": [ { "id": "E-2", "codigo": "MOV-2026-10-002", "fecha": "03/10/2026", "tipo": "Gasto", "categoria": "Mantenimiento",
              "descripcion": "Reparación del ascensor", "monto": 3000, "comprobante": "factura_ascensor.pdf", "proveedor": "...", "cuenta": "Banco Unión" } ] }
```
Solo ingresos extraordinarios y egresos: los pagos de expensas y anticipos van en `GET /pagos` y `GET /anticipos`. Registrar: `POST /ingresos` y `POST /egresos` (existentes).

## 5. Contabilidad (US2.4)

Cada bloque de expensas, cada registro de agua, cada pago, ingreso y egreso genera su asiento. `GET /contabilidad/balance-comprobacion` sigue cuadrando (Debe = Haber) tras cualquier secuencia.
