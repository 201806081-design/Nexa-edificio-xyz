// Cálculo puro del estado de cuenta de una unidad (requisito 2: emisión de estados de cuenta)
const { calcularMora, aCentavos, deCentavos } = require('./expensas.utils');

const CONFIG_MORA_DEFAULT = { tasaMensual: 0, diasGracia: 0, metodo: 'SIMPLE' };

/**
 * @param expensas  [{ id, monto, saldoPendiente, fechaVencimiento, estado, periodo:{anio,mes} }]
 * @param anticipos [{ saldoDisponible }]
 * @param configMora { tasaMensual, diasGracia, metodo }
 * @param hoy Date
 */
function resumirEstadoCuenta({ expensas = [], anticipos = [], configMora = CONFIG_MORA_DEFAULT, hoy = new Date() }) {
  let emitido = 0;
  let pendiente = 0;
  let mora = 0;
  let vencidas = 0;

  const detalle = expensas.map((e) => {
    const montoCent = aCentavos(String(e.monto));
    const saldoCent = aCentavos(String(e.saldoPendiente));
    emitido += montoCent;
    pendiente += saldoCent;

    let moraEstimada = 0;
    let diasAtraso = 0;
    if (saldoCent > 0) {
      const r = calcularMora({
        saldoPendiente: deCentavos(saldoCent),
        tasaMensual: Number(configMora.tasaMensual ?? 0),
        diasGracia: Number(configMora.diasGracia ?? 0),
        metodo: configMora.metodo || 'SIMPLE',
        fechaVencimiento: e.fechaVencimiento,
        fechaCalculo: hoy,
      });
      moraEstimada = r.mora;
      diasAtraso = r.diasAtraso;
      if (diasAtraso > 0) vencidas += 1;
      mora += aCentavos(moraEstimada);
    }
    return { ...e, pagado: deCentavos(montoCent - saldoCent), diasAtraso, moraEstimada };
  });

  const saldoAFavor = anticipos.reduce((acc, a) => acc + aCentavos(String(a.saldoDisponible)), 0);

  return {
    expensas: detalle,
    totales: {
      totalEmitido: deCentavos(emitido),
      totalPagado: deCentavos(emitido - pendiente),
      saldoPendiente: deCentavos(pendiente),
      moraEstimada: deCentavos(mora),
      totalAdeudado: deCentavos(pendiente + mora),
      saldoAFavor: deCentavos(saldoAFavor),
      expensasVencidas: vencidas,
      alDia: pendiente === 0,
    },
  };
}

module.exports = { resumirEstadoCuenta };
