import { PrismaClient } from "@prisma/client";

// Avoid creating many clients in dev (hot reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["query","error","warn"], // uncomment if you want query logs
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;