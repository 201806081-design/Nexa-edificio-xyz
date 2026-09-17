const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const healthRoutes = require('./shared/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const financieroRoutes = require('./modules/financiero/financiero.routes');
const { notFound, errorHandler } = require('./shared/middlewares/error.middleware');

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, servicio: 'NEXA API', health: '/api/health' }));
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/financiero', financieroRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
