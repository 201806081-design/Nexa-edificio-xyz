import 'dotenv/config';

const port = Number(process.env.PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('La variable PORT debe ser un número entre 1 y 65535.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port
};
