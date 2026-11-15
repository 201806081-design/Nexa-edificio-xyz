const service = require('../services/reportes.service');
const { aCSV } = require('../utils/reportes.utils');

/** Responde JSON o, con ?formato=csv, un archivo CSV descargable (compatible con Excel). */
function responder(res, data, { nombre, columnas, filas }) {
  return (formato) => {
    if (String(formato || '').toLowerCase() === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}.csv"`);
      return res.send(aCSV(columnas, filas));
    }
    return res.json({ ok: true, data });
  };
}

function idValido(raw) { const id = Number(raw); return Number.isInteger(id) && id > 0 ? id : null; }

async function indice(req, res, next) {
  try { res.json({ ok: true, data: service.indice() }); } catch (e) { next(e); }
}

async function estadoFinanciero(req, res, next) {
  try {
    const d = await service.estadoFinanciero(req.query);
    const filas = [
      ...d.estadoResultados.ingresos.map((x) => ({ seccion: 'Ingresos', codigo: x.codigo, cuenta: x.cuenta, monto: x.monto })),
      { seccion: 'Ingresos', codigo: '', cuenta: 'TOTAL INGRESOS', monto: d.estadoResultados.totalIngresos },
      ...d.estadoResultados.gastos.map((x) => ({ seccion: 'Gastos', codigo: x.codigo, cuenta: x.cuenta, monto: x.monto })),
      { seccion: 'Gastos', codigo: '', cuenta: 'TOTAL GASTOS', monto: d.estadoResultados.totalGastos },
      { seccion: 'Resultado', codigo: '', cuenta: 'RESULTADO DEL PERIODO', monto: d.estadoResultados.resultado },
      ...d.balanceGeneral.activos.map((x) => ({ seccion: 'Activo', codigo: x.codigo, cuenta: x.cuenta, monto: x.saldo })),
      { seccion: 'Activo', codigo: '', cuenta: 'TOTAL ACTIVO', monto: d.balanceGeneral.totalActivos },
      ...d.balanceGeneral.pasivos.map((x) => ({ seccion: 'Pasivo', codigo: x.codigo, cuenta: x.cuenta, monto: x.saldo })),
      ...d.balanceGeneral.patrimonio.map((x) => ({ seccion: 'Patrimonio', codigo: x.codigo, cuenta: x.cuenta, monto: x.saldo })),
      { seccion: 'Patrimonio', codigo: '', cuenta: 'RESULTADO ACUMULADO', monto: d.balanceGeneral.resultadoAcumulado },
      { seccion: 'Pasivo + Patrimonio', codigo: '', cuenta: 'TOTAL PASIVO + PATRIMONIO', monto: d.balanceGeneral.totalPasivoPatrimonio },
    ];
    responder(res, d, { nombre: `estado-financiero-${d.periodo.replace(/\s+/g, '-')}`, columnas: [{ titulo: 'Sección', campo: 'seccion' }, { titulo: 'Código', campo: 'codigo' }, { titulo: 'Cuenta', campo: 'cuenta' }, { titulo: 'Monto (Bs)', campo: 'monto' }], filas })(req.query.formato);
  } catch (e) { next(e); }
}

async function balanceMensual(req, res, next) {
  try { res.json({ ok: true, data: await service.balanceMensual(req.query) }); } catch (e) { next(e); }
}

async function flujoCaja(req, res, next) {
  try {
    const d = await service.reporteFlujoCaja(req.query);
    responder(res, d, {
      nombre: `flujo-de-caja-${d.periodo.replace(/\s+/g, '-')}`,
      columnas: [{ titulo: 'Periodo', campo: 'periodo' }, { titulo: 'Saldo inicial', campo: 'saldoInicial' }, { titulo: 'Ingresos', campo: 'ingresos' }, { titulo: 'Egresos', campo: 'egresos' }, { titulo: 'Flujo neto', campo: 'flujoNeto' }, { titulo: 'Saldo final', campo: 'saldoFinal' }],
      filas: d.meses,
    })(req.query.formato);
  } catch (e) { next(e); }
}

async function ingresosGastos(req, res, next) {
  try {
    const d = await service.ingresosGastos(req.query);
    responder(res, d, {
      nombre: `ingresos-y-gastos-${d.periodo.replace(/\s+/g, '-')}`,
      columnas: [{ titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Tipo', campo: 'tipo' }, { titulo: 'Categoría', campo: 'categoria' }, { titulo: 'Descripción', campo: 'descripcion' }, { titulo: 'Monto (Bs)', campo: 'monto' }, { titulo: 'Cuenta', campo: 'cuenta' }, { titulo: 'Comprobante', campo: 'comprobante' }],
      filas: d.detalle,
    })(req.query.formato);
  } catch (e) { next(e); }
}

async function morosos(req, res, next) {
  try {
    const d = await service.listaMorosos(req.query);
    responder(res, d, {
      nombre: `morosos-${d.fecha}`,
      columnas: [{ titulo: 'Tipo Dpto', campo: 'tipoDpto' }, { titulo: 'Dpto', campo: 'dpto' }, { titulo: 'Responsable', campo: 'responsable' }, { titulo: 'Teléfono', campo: 'telefono' }, { titulo: 'Expensas vencidas', campo: 'expensasVencidas' }, { titulo: 'Días de mora', campo: 'diasMora' }, { titulo: 'Capital (Bs)', campo: 'capital' }, { titulo: 'Mora (Bs)', campo: 'mora' }, { titulo: 'Total adeudado (Bs)', campo: 'totalAdeudado' }, { titulo: 'Periodos', campo: 'periodos' }],
      filas: d.filas,
    })(req.query.formato);
  } catch (e) { next(e); }
}

async function historialPagos(req, res, next) {
  try {
    const id = idValido(req.params.unidadId);
    if (!id) return res.status(400).json({ ok: false, error: 'unidadId debe ser un entero positivo' });
    const d = await service.historialPagos(id, req.query);
    responder(res, d, {
      nombre: `historial-pagos-${d.departamento.replace(/[^\w]+/g, '-')}`,
      columnas: [{ titulo: 'Fecha', campo: 'fecha' }, { titulo: 'Periodo', campo: 'periodo' }, { titulo: 'Monto pagado (Bs)', campo: 'montoPagado' }, { titulo: 'Capital', campo: 'capital' }, { titulo: 'Mora', campo: 'mora' }, { titulo: 'Anticipo', campo: 'anticipo' }, { titulo: 'Método', campo: 'metodo' }, { titulo: 'Referencia', campo: 'referencia' }, { titulo: 'Saldo restante', campo: 'saldoRestante' }],
      filas: d.pagos,
    })(req.query.formato);
  } catch (e) { next(e); }
}

module.exports = { indice, estadoFinanciero, balanceMensual, flujoCaja, ingresosGastos, morosos, historialPagos };
