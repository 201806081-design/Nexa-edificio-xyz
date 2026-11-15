# API · Reportes financieros base (HU-RE-01 · SCRUM-106 · sección 8 de la lista del docente)

Base `{VITE_API_BASE_URL}/financiero/reportes` · `Authorization: Bearer <token>` · solo lectura (cualquier rol).
Todos trabajan con la **fecha del sistema** (real o simulada). `?formato=csv` descarga el reporte como archivo CSV (abre en Excel).

| # | Reporte | Ruta | Parámetros | Lista del docente |
|---|---|---|---|---|
| 8.1 | Estado financiero | `GET /estado-financiero` | `anio`, `mes` (opcional), `formato=csv` | Deseable |
| 8.2 | Balance mensual | `GET /balance-mensual` | `anio`, `mes` | Deseable |
| 8.3 | Flujo de caja | `GET /flujo-caja` | `anio`, `mes` (opcional), `formato=csv` | Deseable |
| 8.4 | Lista de morosos | `GET /morosos` | `minDias`, `formato=csv` | **Crítico** |
| 8.5 | Ingresos y gastos | `GET /ingresos-gastos` | `anio`, `mes` (opcional), `formato=csv` | Deseable |
| 8.6 | Historial de pagos por departamento | `GET /historial-pagos/:unidadId` | `anio`, `mes`, `formato=csv` | **Crítico** |

`GET /reportes` devuelve este índice.

## 8.1 Estado financiero
Sale de la contabilidad (asientos de partida doble):
- `estadoResultados` del período: `ingresos[] {codigo, cuenta, monto}`, `totalIngresos`, `gastos[]`, `totalGastos`, `resultado`, `superavit`.
- `balanceGeneral` a la fecha de corte: `activos[]`, `pasivos[]`, `patrimonio[]`, `resultadoAcumulado`, `totalActivos`, `totalPasivoPatrimonio`, `cuadra` (Activo = Pasivo + Patrimonio + Resultado).

Las dos partes usan el mismo corte: el fin del período pedido. Así el resultado, el balance y el flujo de caja del mismo período hablan de los mismos asientos. La respuesta trae `fechaCorte`, `fechaSistema`, `aperturaRegistrada`, `asientosPosterioresALaFechaDelSistema` y `notas[]`.

### Asiento de apertura (requisito del balance general)
Los saldos iniciales de caja y bancos viven en la tabla de cuentas; para que el balance muestre el efectivo real deben estar también en la contabilidad.
- `GET /financiero/contabilidad/apertura` → `{ registrada, asientoId, fecha, totalSaldosIniciales, cuentas[] }`
- `POST /financiero/contabilidad/apertura` (ADMINISTRADOR, una sola vez por base de datos) → crea el asiento: Debe Caja y Bancos por su saldo inicial / Haber 3.1.01 Fondo Común, con fecha del día anterior al primer asiento. 409 si ya existe.

## 8.2 Balance mensual
`actual` y `anterior`, cada uno con:
- `expensas { generado, unidades, emitido, agua, extras, cobrado, pendiente, porcentajeCobrado }`
- `caja { saldoInicial, ingresos, egresos, resultado, saldoFinal, cobroExpensas, ingresosExtraordinarios, gastosOperativos, personal }`
y `variacion { ingresos, egresos, resultado, cobrado }` con diferencia y porcentaje respecto al mes anterior.

## 8.3 Flujo de caja (pantalla Flujo de caja)
`{ saldoInicial, totalIngresos, totalEgresos, flujoNeto, saldoFinal, meses: [ { periodo, etiqueta: "Nov", saldoInicial, ingresos, egresos, flujoNeto, saldoFinal, detalleIngresos[], detalleEgresos[] } ], cuentasAlInicio[], saldosActuales[] }`
Conceptos: Cobro de expensas · Ingresos extraordinarios · Gastos operativos · Sueldos y anticipos al personal · Ajustes.
Sin `mes` devuelve los 12 meses del año (gráfico anual).

## 8.4 Lista de morosos (crítico)
`{ fecha, resumen { unidades, capital, mora, total }, filas: [ { tipoDpto, dpto, responsable, telefono, email, expensasVencidas, diasMora, capital, mora, totalAdeudado, periodos } ] }`
La mora usa la política vigente (monto fijo o porcentaje) y la fecha del sistema.

## 8.5 Ingresos y gastos (mensual y anual)
`{ resumen { totalIngresos, totalGastos, resultado }, ingresos { cobroExpensas { total, capital, mora, anticipos, pagos }, extraordinarios { total, porCategoria[] } }, gastos { operativos { total, porCategoria[] }, personal { total, planillasPagadas, anticipos } }, detalle[] }`
`porCategoria[]`: `{ categoria, monto, cantidad, porcentaje }`.

## 8.6 Historial de pagos por departamento (crítico)
`{ departamento, tipoDpto, responsable, periodoConsultado, resumen { totalGenerado, totalPagado, saldoPendiente, interesEstimado, saldoAFavor, pagos }, pagos: [ { fecha, periodo, montoPagado, capital, mora, anticipo, metodo, referencia, saldoRestante } ], expensas[] }`
