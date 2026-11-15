# Requerimientos críticos (lista del docente, 6-nov) — estado y cómo demostrarlos

Leyenda: API = backend desplegado en Render y probado · UI = pantalla del frontend conectada a la API.

| Crítico | Qué pide | API (backend) | Endpoint principal | UI | Cómo se demuestra |
|---|---|---|---|---|---|
| 1.1 | Datos personales básicos del copropietario | pendiente (módulo copropietarios) | — | pantalla con datos de prueba | — |
| 1.2 | Inmuebles y de quién es cada uno (Dpto + parqueo + baulera) | lectura lista | `GET /financiero/unidades/selector` | pantalla con datos de prueba | selector con tipo, piso y responsable |
| 2.1 | Generación mensual por tipo de Dpto (A 300, B 350, C 400) | ✅ | `POST /financiero/periodos` (`montosPorCategoria`, `categorias`) | por conectar | generar bloque A, luego B |
| 2.2 | Montos individuales adicionales con descripción (agua y otros) | ✅ | `PUT /periodos/:id/agua/:unidadId` · `POST /periodos/:id/extras/:unidadId` | por conectar | agua 35 + "Extra pintura edificio 250" |
| 2.3 | Listado por tipo de Dpto: Tipo, Dpto, Expensa, Agua, Extra… | ✅ | `GET /periodos/:id/cargos` | por conectar | listado con subtotales por tipo |
| 3.1 | Configurar mora: vencimiento, monto fijo o %, fecha de generación | ✅ | `GET/PUT /configuracion/mora` | por conectar | cambiar de Bs 50 fijos a 5 % |
| 4.1 | Pago QR antes del vencimiento (sin multa) | ✅ | `PUT /configuracion/fecha-sistema` + `POST /pagos` | por conectar | fecha 05-nov → mora 0 |
| 4.2 | Pago QR el día del vencimiento | ✅ | ídem | por conectar | fecha 10-nov → mora 0 |
| 4.3 | Pago QR después del vencimiento (con multa) | ✅ | ídem + `GET /pagos/simular` | por conectar | fecha 20-nov → mora 50 |
| 5.1 | Pagos anticipados que se descuentan de los cargos | ✅ | `POST /pagos` (sobrante) + aplicación al generar | por conectar | pagar 1.000 → generar mes siguiente |
| 8.4 | Lista de morosos | ✅ | `GET /reportes/morosos` (+ CSV) | por conectar | lista con tipo, días y total |
| 8.6 | Historial de pagos por departamento | ✅ | `GET /reportes/historial-pagos/:unidadId` (+ CSV) | por conectar | pagos con capital, mora y saldo |
| 12.1 | App móvil: consulta de estado de cuenta | API lista | `GET /financiero/estado-cuenta/:unidadId` | pendiente (app/portal) | — |
| 12.6 | App móvil: pago de cargos por QR | API lista | `POST /financiero/pagos` (`metodo: "QR"`) | pendiente (app/portal) | — |

Secuencia de defensa sugerida (10 minutos, sobre la URL pública):
1. Configurar la política de mora (Bs 50 fijos, vence el 10, se genera el 1).
2. Generar el mes por tipo (A y B) → registrar agua y un extra con descripción → mostrar el listado por tipo.
3. Fijar la fecha del sistema y pagar por QR antes, el día y después del vencimiento.
4. Pagar de más (anticipo) y generar el mes siguiente: el saldo a favor se descuenta solo.
5. Lista de morosos e historial de pagos del departamento (y descargar el CSV).
6. Balance de comprobación: Debe = Haber.
