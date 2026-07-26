// src/lib/db.ts

import { PrismaClient } from '@prisma/client';

// ✅ Prisma 6 - Simple and working
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
