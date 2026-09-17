const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ROLES, etiquetaDeRol, rolDesdeEtiqueta } = require('../src/shared/constants/roles');

describe('roles · mapeo BD ↔ frontend', () => {
  it('convierte el enum de BD a la etiqueta que usa el frontend (HU-SE-02)', () => {
    assert.equal(etiquetaDeRol(ROLES.ADMINISTRADOR), 'Administrador');
    assert.equal(etiquetaDeRol(ROLES.DIRECTORIO), 'Directorio');
    assert.equal(etiquetaDeRol(ROLES.CONSULTA), 'Consulta');
  });

  it('devuelve null para un rol desconocido', () => {
    assert.equal(etiquetaDeRol('SUPERUSUARIO'), null);
  });

  it('convierte la etiqueta de vuelta al enum, sin importar mayúsculas', () => {
    assert.equal(rolDesdeEtiqueta('Administrador'), 'ADMINISTRADOR');
    assert.equal(rolDesdeEtiqueta('directorio'), 'DIRECTORIO');
    assert.equal(rolDesdeEtiqueta('CONSULTA'), 'CONSULTA');
    assert.equal(rolDesdeEtiqueta('otro'), null);
  });
});
