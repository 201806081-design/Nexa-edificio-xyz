# API · Críticos del docente (lista del 6-nov) — qué endpoint cubre cada uno

Base `{VITE_API_BASE_URL}/financiero` · `Authorization: Bearer <token>` · escrituras: ADMINISTRADOR.

| Crítico | Endpoint |
|---|---|
| 2.1 Expensas por tipo de Dpto (A: 300, B: 350, C: 400) | `POST /periodos` con `montosPorCategoria` (y `categorias` para bloques) |
| 2.2 Montos individuales adicionales con descripción (agua y otros) | `PUT /periodos/:id/agua/:unidadId` · **`POST /periodos/:id/extras/:unidadId`** · `DELETE /periodos/:id/extras/:extraId` |
| 2.3 Listado por tipo de Dpto: Tipo · Dpto · Expensa · Agua · Extra… | **`GET /periodos/:id/cargos`** |
| 3.1 Política de mora: vencimiento, monto fijo o %, fecha de generación | `GET/PUT /configuracion/mora` (ahora con **Monto fijo** y **diaGeneracion**) |
| 4.1–4.3 Simular pagos QR antes / en / después del vencimiento | **`PUT /configuracion/fecha-sistema`** + `GET /pagos/simular` + `POST /pagos` (`metodo: "QR"`) |
| 5.1 Pagos anticipados que se descuentan de los cargos mensuales | `POST /pagos` (sobrante → saldo a favor) + **aplicación automática al generar** + `POST /periodos/:id/aplicar-anticipos` |
| 8.4 Lista de morosos | `GET /morosos` · `GET /mora` |
| 8.6 Historial de pagos por departamento | `GET /estado-cuenta/:unidadId` |

## 2.2 · Cargos adicionales con descripción
`POST /periodos/:id/extras/:unidadId` `{ "descripcion": "Extra pintura edificio", "monto": 250 }` → 201.
Sube el total y el saldo de la expensa de esa unidad y asienta (Cuentas por cobrar / Ingresos por expensas).
`DELETE /periodos/:id/extras/:extraId` lo revierte. El agua sigue en `PUT /periodos/:id/agua/:unidadId`.

## 2.3 · Listado por tipo de departamento
`GET /periodos/:id/cargos?categoria=A`
```json
{ "periodo": { "etiqueta": "Noviembre 2026", "fechaVencimiento": "2026-11-10" },
  "columnas": ["Tipo Dpto","Dpto","Expensa","Agua","Extras","Total","Pagado","Saldo"],
  "totales": { "unidades": 5, "expensa": 1070, "agua": 96, "extras": 250, "total": 1416, "pagado": 0, "saldo": 1416 },
  "grupos": [ { "grupo": "Tipo A", "unidades": 2, "expensa": 600, "agua": 76, "extras": 250, "total": 926, "filas": [ "..." ] } ],
  "filas": [ { "tipoDpto": "A", "dpto": "Depto. 101", "expensa": 300, "agua": 35, "extras": [ { "descripcion": "Extra pintura edificio", "monto": 250 } ], "totalExtras": 250, "total": 585, "pagado": 0, "saldo": 585, "estadoUI": "Pendiente" } ] }
```

## 3.1 · Política de mora
`PUT /configuracion/mora`
- Monto fijo: `{ "tipoInteres": "Monto fijo", "montoFijo": 50, "diasGracia": 0, "diaVencimiento": 10, "diaGeneracion": 1 }`
- Porcentaje: `{ "tipoInteres": "Porcentaje mensual", "porcentaje": 5, "metodo": "SIMPLE", "diaVencimiento": 10, "diaGeneracion": 1 }`

`GET /configuracion/mora` devuelve además `proximaGeneracion` y `proximoVencimiento` como fechas completas (p. ej. "2026-12-01" y "2026-11-10"), y una `descripcion` legible.
`POST /periodos` usa `diaGeneracion` para la fecha de emisión y acepta `fechaVencimiento: "2026-11-10"` para fijar un vencimiento concreto.

## 4 · Fecha del sistema y simulación de pagos
- `GET /configuracion/fecha-sistema` → `{ simulada, fechaSimulada, fechaReal, fechaActual }`
- `PUT /configuracion/fecha-sistema` `{ "fecha": "2026-11-15" }` → todo el sistema (vencimientos, mora, pagos, dashboard) trabaja con esa fecha.
- `DELETE /configuracion/fecha-sistema` → vuelve a la fecha real.
- `GET /pagos/simular?unidadId=1&monto=400` → sin escribir: por expensa, `diasAtraso`, `mora`, `situacion` ("Antes del vencimiento (sin mora)" · "El día del vencimiento (sin mora)" · "Después del vencimiento (con mora)") y cómo se aplicaría el monto.
- `POST /pagos` `{ "unidadId": 1, "cuentaId": 2, "monto": 385, "metodo": "QR", "referencia": "QR-0001" }`: **la mora se cobra automáticamente según la política vigente y la fecha del sistema** (o `fecha` explícita). `cobrarMora: false` la omite. Respuesta con `fechaConsiderada`, `politica`, `situacion` y `aplicaciones[].diasAtraso`.

Secuencia de demostración: fijar fecha 2026-11-05 → pagar (sin mora) · fijar 2026-11-10 → pagar (sin mora, es el día del vencimiento) · fijar 2026-11-20 → pagar (con mora: Bs 50 fijos o el % según la política).

## 5.1 · Anticipos aplicados a los cargos del mes
Un pago mayor a la deuda deja saldo a favor (`Anticipo` DISPONIBLE). Al generar el mes (`POST /periodos`) el saldo a favor se aplica solo a la nueva expensa (estado PARCIAL/PAGADA, detalle de pago y asiento Anticipos de copropietarios / Cuentas por cobrar). `POST /periodos/:id/aplicar-anticipos` lo reaplica, p. ej. tras cargar agua o extras.
