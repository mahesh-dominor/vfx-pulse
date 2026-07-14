import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Must use DATABASE_URL — same connection the runtime PrismaClient uses in
    // lib/prisma.ts. Using a different URL (e.g. POSTGRES_URL) would apply
    // migrations to a different database than the one the app queries.
    url: env("DATABASE_URL"),
  },
});