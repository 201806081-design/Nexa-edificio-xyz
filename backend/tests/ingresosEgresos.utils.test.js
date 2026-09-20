const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validarDatosMovimientoManual } = require('../src/modules/financiero/utils/ingresosEgresos.utils');

describe('validarDatosMovimientoManual', () => {
  it('normaliza un ingreso válido', () => {
    const d = validarDatosMovimientoManual({ categoriaId: '1', cuentaId: '2', monto: '800.5', descripcion: 'Alquiler salón', fecha: '2026-09-03' }, 'INGRESO');
    assert.equal(d.categoriaId, 1);
    assert.equal(d.monto, 800.5);
    assert.equal(d.proveedor, undefined);
  });

  it('en egresos conserva proveedor y número de factura', () => {
    const d = validarDatosMovimientoManual({ categoriaId: 4, cuentaId: 1, monto: 420.5, descripcion: 'Factura ELFEC', proveedor: 'ELFEC', nroFactura: '00123' }, 'EGRESO');
    assert.equal(d.proveedor, 'ELFEC');
    assert.equal(d.nroFactura, '00123');
  });

  it('rechaza descripción corta, monto cero y fecha inválida con 400', () => {
    for (const body of [
      { categoriaId: 1, cuentaId: 1, monto: 10, descripcion: 'ab' },
      { categoriaId: 1, cuentaId: 1, monto: 0, descripcion: 'valido' },
      { categoriaId: 1, cuentaId: 1, monto: 10, descripcion: 'valido', fecha: 'ayer' },
    ]) {
      assert.throws(() => validarDatosMovimientoManual(body, 'INGRESO'), (e) => e.status === 400);
    }
  });
});
