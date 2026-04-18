const { PrismaClient } = require('@prisma/client');

// Prisma automatically uses the connection pool and manages connections
// It respects the DATABASE_URL environment variable.
const prisma = new PrismaClient();

module.exports = prisma;
