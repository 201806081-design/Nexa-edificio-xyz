const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { login } = require('../src/modules/auth/auth.service');

describe('login input validation', () => {
  it('rejects a username containing only whitespace before querying the database', async () => {
    await assert.rejects(
      login({ usuario: '   ', password: '1234' }),
      (error) => error.status === 400 && error.message === 'usuario y password son obligatorios'
    );
  });

  it('rejects missing credentials before querying the database', async () => {
    await assert.rejects(
      login({ usuario: 'usuario1' }),
      (error) => error.status === 400 && error.message === 'usuario y password son obligatorios'
    );
  });
});
