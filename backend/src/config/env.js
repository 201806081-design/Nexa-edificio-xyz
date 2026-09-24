// Carga y valida variables de entorno en un solo lugar.
require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 8000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

const secretoInseguro = !process.env.JWT_SECRET || process.env.JWT_SECRET === 'reemplazar-por-un-valor-seguro';
if (env.NODE_ENV === 'production' && secretoInseguro) {
  throw new Error('JWT_SECRET debe configurarse con un valor seguro en producción');
}
if (env.NODE_ENV !== 'test' && secretoInseguro) {
  console.warn('⚠️  JWT_SECRET no configurado: usando valor de desarrollo. Define JWT_SECRET en .env');
}

module.exports = env;
