// Punto de entrada (el Dockerfile ejecuta: node src/index.js)
const env = require('./config/env');
const app = require('./app');
const prisma = require('./config/prisma');

async function main() {
  await prisma.$connect();
  console.log('✅ PostgreSQL conectada');
  app.listen(env.PORT, () => {
    console.log(`🚀 NEXA API en http://localhost:${env.PORT}/api  [${env.NODE_ENV}]`);
    console.log('   POST /api/auth/login · GET /api/auth/me · GET /api/health');
    console.log('   GET  /api/financiero/expensas · /cuentas · /periodos · /unidades/:id/estado-cuenta');
    console.log('   POST /api/financiero/pagos · /ingresos · /egresos   (rol ADMINISTRADOR)');
    console.log('   GET  /api/financiero/contabilidad/plan-cuentas · /asientos · /balance-comprobacion');
  });
}

main().catch((err) => {
  console.error('❌ Error al iniciar:', err.message);
  process.exit(1);
});

for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
