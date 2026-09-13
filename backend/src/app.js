import express from 'express';
import { apiRouter } from './routes/index.js';

export const app = express();

app.use(express.json());
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ estado: 'ok' });
});

app.use((error, _req, res, _next) => {
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Ya existe un registro con uno de los valores únicos enviados.'
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(error);
  return res.status(500).json({ error: 'Ocurrió un error interno.' });
});
