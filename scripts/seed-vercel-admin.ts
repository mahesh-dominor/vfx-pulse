import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "@prisma/client";

// Load local production env file if present (local runs). On Vercel,
// DATABASE_URL is already injected by the platform so this is a no-op.
dotenv.config({ path: ".env.vercel.production" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.trim() === "") {
  throw new Error(
    "Missing DATABASE_URL. Add it to .env.vercel.production for local runs, " +
    "or ensure it is set as a Vercel environment variable."
  );
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function ensureAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@vfxpulse.com" },
    select: {
      email: true,
      username: true,
      isActive: true,
      deletedAt: true,
      password: true,
    },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    await prisma.user.create({
      data: {
        name: "Administrator",
        email: "admin@vfxpulse.com",
        username: "admin",
        password: hashedPassword,
        role: UserRole.ADMIN,
        designation: "SUPERVISOR",
        department: "PRODUCTION",
        isActive: true,
      },
    });

    return {
      created: true,
    };
  }

  return {
    created: false,
    email: existingAdmin.email,
    username: existingAdmin.username,
    isActive: existingAdmin.isActive,
    deletedAt: existingAdmin.deletedAt,
    passwordMatchesAdmin123: await bcrypt.compare("Admin@123", existingAdmin.password),
  };
}

async function main() {
  const result = await ensureAdmin();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });