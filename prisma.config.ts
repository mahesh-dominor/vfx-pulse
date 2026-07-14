import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer POSTGRES_URL (Vercel Postgres direct/non-pooled connection) for
    // migrations. Falls back to DATABASE_URL for local dev and other envs.
    url: process.env.POSTGRES_URL ? process.env.POSTGRES_URL : env("DATABASE_URL"),
  },
});