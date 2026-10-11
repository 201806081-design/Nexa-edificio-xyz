# API · Motor de expensas, mora y anticipos (Sprint 2 · US2.1) — contrato para el frontend

Base: `{VITE_API_BASE_URL}/financiero` · `Authorization: Bearer <token>` en todas. Escrituras: rol ADMINISTRADOR.
Respuestas `{ ok: true, data }`; errores `{ ok: false, error }`.

Regla nueva del motor: **el estado de una expensa se decide por fecha y saldo** (PAGADA · PENDIENTE · PARCIAL · VENCIDA).
Cada lectura sincroniza las vencidas; `POST /expensas/sincronizar` lo fuerza a mano.

## Pantalla "Expensas" (expensasMock.js)

`GET /expensas?anio=2026&mes=10&estado=Pendiente|Pagado|Vencido|Todos&unidadId=3`

```json
{ "ok": true, "total": 3,
  "resumen": { "totalGenerado": 10500, "pendiente": 7000, "pagado": 3500, "vencido": 850, "interesEstimado": 12.4,
               "cantidad": 3, "porEstado": { "pendientes": 1, "parciales": 0, "pagadas": 1, "vencidas": 1 } },
  "data": [ { "id": 1, "departamento": "Depto. 101", "periodo": "Octubre 2026", "monto": 350, "pagado": 0, "saldo": 350,
              "estado": "VENCIDA", "estadoUI": "Vencido", "fechaVencimiento": "2026-10-10", "diasAtraso": 26,
              "moraEstimada": 6.07, "totalPendiente": 356.07, "unidadId": 1, "periodoDetalle": { "anio": 2026, "mes": 10 } } ] }
```
`RESUMEN_EXPENSAS` ← `resumen` · `EXPENSAS_MOCK` ← `data` (usar `estadoUI` para el chip) · `PERIODOS` ← `GET /periodos` (`etiqueta`).

## Asistente "Generar expensas" (3 pasos)

- Paso 1 (período y tarifas): `GET /periodos` para ver qué meses ya existen.
- Paso 2 (vista previa, `DEPARTAMENTOS_ACTIVOS`): `POST /periodos/vista-previa` con el mismo cuerpo que la generación. **No escribe.**
  ```json
  { "anio": 2026, "mes": 11, "modo": "FIJO", "montosPorTipo": { "DEPARTAMENTO": 350, "PARQUEO": 80, "BAULERA": 40 }, "diaVencimiento": 10 }
  ```
  → `{ periodo: { anio, mes, etiqueta }, modo, fechaEmision, fechaVencimiento, yaGenerado, cantidad, totalEmitido,
       unidades: [ { unidadId, departamento: "Depto. 101", tipo, piso, coeficiente, expensa: 350, estado: "Pendiente" } ] }`
  Modo alternativo: `{ "modo": "COEFICIENTE", "presupuestoTotal": 12000 }` (prorrateo por alícuota).
- Paso 3 (confirmar): `POST /periodos` con el mismo cuerpo → 201 `{ periodo, expensasGeneradas, totalEmitido, asientoId }`. 409 si el mes ya existe.
- `PATCH /periodos/:id/cerrar` → cierra el período (sin nuevas emisiones).

## Pantalla "Mora y pagos anticipados" (moraMock.js)

`GET /mora`
```json
{ "configuracion": { "activo": true, "tipoInteres": "Porcentaje mensual", "porcentaje": 2, "diasGracia": 5, "aplicarDesde": "Periodo vencido" },
  "resumen": { "deudasVencidas": 1057, "interesAcumulado": 21, "totalVencido": 1078, "saldoAFavor": 1050, "unidadesConMora": 2 },
  "saldosVencidos": [ { "id": 4, "departamento": "Depto. 301", "periodo": "Septiembre 2026", "capital": 350, "interes": 7, "totalPendiente": 357, "estado": "Vencido", "diasAtraso": 26 } ],
  "pagosAnticipados": [ { "id": 1, "codigo": "ANT-2026-10-302-0001", "fecha": "01/10/2026", "departamento": "Depto. 302", "capital": 1050, "saldoAFavor": 1050, "estado": "Anticipado" } ] }
```
`RESUMEN_MORA` ← `resumen` · `SALDOS_VENCIDOS` ← `saldosVencidos` · `PAGOS_ANTICIPADOS` ← `pagosAnticipados` · `CONFIG_INTERES` ← `configuracion`.

- `GET /anticipos?unidadId=&estado=Anticipado|Aplicado` → lista.
- `GET /anticipos/:id` → `DETALLE_ANTICIPO`: `{ codigo, departamento, responsable, fechaPago, montoAnticipado, deudaPendiente, saldoAFavor, aplicacion: [ { periodo, monto, estado } ], aplicacionEsEstimada: true }`.
- Registrar un anticipo = `POST /pagos` con `{ unidadId, monto, metodo, referencia }`: el pago cubre primero deudas (mora y luego capital) y el excedente queda como anticipo DISPONIBLE, que se aplica solo al emitir los siguientes períodos.
  `DEPARTAMENTOS_ANTICIPO` ← `GET /unidades` (etiqueta, responsable, última expensa).

## Pantalla "Configurar interés" (CONFIG_INTERES)

- `GET /configuracion/mora` → `{ configurada: true, data: { activo, tipoInteres, porcentaje, diasGracia, diaVencimiento, metodo, aplicarDesde, vigenteDesde } }`
- `PUT /configuracion/mora` (ADMINISTRADOR)
  ```json
  { "activo": true, "tipoInteres": "Porcentaje mensual", "porcentaje": 2, "diasGracia": 5, "diaVencimiento": 10, "metodo": "SIMPLE" }
  ```
  Crea una vigencia desde hoy y cierra la anterior (historial en `GET /configuracion/mora/historial`). `tipoInteres: "Monto fijo"` → 400 (no implementado en el motor).
  `activo: false` guarda tasa 0 (sin interés).

## Fórmula de mora (recordatorio)

SIMPLE: `saldo × tasa% × diasAtraso/30` · COMPUESTO: `saldo × [(1+t)^meses × (1 + t × diasResto/30) − 1]` · `diasAtraso = días desde el vencimiento − diasGracia` (nunca negativo).
