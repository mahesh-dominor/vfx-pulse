import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString,
  max: 2, // Minimal pool size for Vercel Postgres limits
  idleTimeoutMillis: 10000, // Close idle connections quickly (10 seconds)
  connectionTimeoutMillis: 5000, // Shorter timeout
  reapIntervalMillis: 1000, // Check for idle connections every second
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"], // Only log errors to avoid performance issues
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}