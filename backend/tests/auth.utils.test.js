const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { extraerToken, autorizar } = require('../src/shared/middlewares/auth.utils');
const { ROLES } = require('../src/shared/constants/roles');

describe('extraerToken', () => {
  it('extrae el token de un header Bearer válido', () => {
    assert.equal(extraerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
    assert.equal(extraerToken('bearer   xyz'), 'xyz');
  });

  it('devuelve null si falta el header, el esquema o el token', () => {
    assert.equal(extraerToken(undefined), null);
    assert.equal(extraerToken(''), null);
    assert.equal(extraerToken('Basic abc'), null);
    assert.equal(extraerToken('Bearer'), null);
    assert.equal(extraerToken(123), null);
  });
});

function fakeNext() {
  const llamadas = [];
  const next = (err) => llamadas.push(err);
  next.llamadas = llamadas;
  return next;
}

describe('autorizar (control de acceso por rol)', () => {
  it('deja pasar a un rol permitido', () => {
    const next = fakeNext();
    autorizar(ROLES.ADMINISTRADOR)({ user: { rol: 'ADMINISTRADOR' } }, {}, next);
    assert.equal(next.llamadas.length, 1);
    assert.equal(next.llamadas[0], undefined);
  });

  it('acepta varios roles permitidos', () => {
    const next = fakeNext();
    autorizar(ROLES.ADMINISTRADOR, ROLES.DIRECTORIO)({ user: { rol: 'DIRECTORIO' } }, {}, next);
    assert.equal(next.llamadas[0], undefined);
  });

  it('responde 403 a un rol no permitido', () => {
    const next = fakeNext();
    autorizar(ROLES.ADMINISTRADOR)({ user: { rol: 'CONSULTA' } }, {}, next);
    assert.equal(next.llamadas[0].status, 403);
    assert.match(next.llamadas[0].message, /CONSULTA/);
  });

  it('responde 401 si no hay usuario autenticado', () => {
    const next = fakeNext();
    autorizar(ROLES.ADMINISTRADOR)({}, {}, next);
    assert.equal(next.llamadas[0].status, 401);
  });
});
