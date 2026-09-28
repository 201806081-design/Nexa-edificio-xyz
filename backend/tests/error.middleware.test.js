const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler, notFound } = require('../src/shared/middlewares/error.middleware');

function fakeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

describe('error middleware', () => {
  it('hides internal details from server error responses', () => {
    const response = fakeResponse();
    const original = console.error;
    console.error = () => {};

    try {
      errorHandler(new Error('database password leaked'), {}, response, () => {});
    } finally {
      console.error = original;
    }

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, { ok: false, error: 'Error interno del servidor' });
  });

  it('preserves client validation messages', () => {
    const response = fakeResponse();
    errorHandler({ status: 422, message: 'Datos inválidos' }, {}, response, () => {});

    assert.equal(response.statusCode, 422);
    assert.deepEqual(response.body, { ok: false, error: 'Datos inválidos' });
  });

  it('maps Prisma unique constraint violations to conflicts', () => {
    const response = fakeResponse();
    errorHandler({ code: 'P2002', meta: { target: ['email'] } }, {}, response, () => {});

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, { ok: false, error: 'Ya existe un registro con el mismo valor en: email' });
  });

  it('returns a structured 404 for unknown routes', () => {
    const response = fakeResponse();
    notFound({ method: 'GET', originalUrl: '/missing' }, response);

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { ok: false, error: 'Ruta no encontrada: GET /missing' });
  });
});
