// Singleton Prisma client. Reused across dev hot-reloads via `globalThis` so
// each file save doesn't open a fresh connection pool against Postgres.

import { PrismaClient } from '@/app/generated/prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
