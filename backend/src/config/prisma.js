// Instancia única de PrismaClient compartida por todos los módulos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  // BD remota (Neon): más margen para transacciones interactivas
  transactionOptions: { maxWait: 10000, timeout: 30000 },
});

module.exports = prisma;
