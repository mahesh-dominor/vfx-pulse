import "dotenv/config";

import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, ProjectStatus, ShotStatus } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // Create Admin User
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@vfxpulse.com" },
  });

  let admin = existingAdmin;
  if (!admin) {
    const hashedPassword = await bcrypt.hash("Admin@123", 12);
    admin = await prisma.user.create({
      data: {
        name: "Administrator",
        email: "admin@vfxpulse.com",
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    console.log("✅ Admin created");
  } else {
    console.log("✅ Admin already exists");
  }

  // Create Test Users
  const artistEmails = [
    { email: "amit@vfxpulse.com", name: "Amit Kumar", role: "Compositing" },
    { email: "pooja@vfxpulse.com", name: "Pooja Singh", role: "Lighting" },
    { email: "rahul@vfxpulse.com", name: "Rahul Sharma", role: "FX" },
    { email: "nikhil@vfxpulse.com", name: "Nikhil K", role: "Animation" },
  ];

  for (const artist of artistEmails) {
    const existing = await prisma.user.findUnique({
      where: { email: artist.email },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash("Artist@123", 12);
      await prisma.user.create({
        data: {
          name: artist.name,
          email: artist.email,
          password: hashedPassword,
          role: UserRole.ARTIST,
          isActive: true,
        },
      });
      console.log(`✅ Artist ${artist.name} created`);
    }
  }

  // Create Projects
  const projectCodes = ["HEDA", "CADS2", "SWAG", "BR70"];
  const projects = [];

  for (const code of projectCodes) {
    const existing = await prisma.project.findUnique({
      where: { code },
    });

    if (!existing) {
      const project = await prisma.project.create({
        data: {
          name: `Project ${code}`,
          code,
          description: `VFX Production for ${code}`,
          client: "Client Name",
          fps: 24,
          resolution: "3840x2160",
          colorSpace: "Linear",
          status: ProjectStatus.ACTIVE,
          producerId: admin.id,
        },
      });
      projects.push(project);
      console.log(`✅ Project ${code} created`);
    } else {
      projects.push(existing);
    }
  }

  // Create Sequences and Shots
  for (const project of projects) {
    const sequenceCount = await prisma.sequence.count({
      where: { projectId: project.id },
    });

    if (sequenceCount === 0) {
      for (let i = 1; i <= 3; i++) {
        const sequence = await prisma.sequence.create({
          data: {
            code: `${project.code}_SEQ_${i}`,
            name: `Sequence ${i}`,
            projectId: project.id,
          },
        });

        // Create Shots for each sequence
        for (let j = 1; j <= 5; j++) {
          await prisma.shot.create({
            data: {
              code: `${project.code}_${i.toString().padStart(3, "0")}_${j.toString().padStart(3, "0")}`,
              shotName: `Shot ${j}`,
              description: `VFX shot for sequence ${i}`,
              status: ShotStatus.WIP,
              priority: 1,
              frameStart: (j - 1) * 100 + 1,
              frameEnd: j * 100,
              estimatedHours: 8 + Math.random() * 16,
              projectId: project.id,
              sequenceId: sequence.id,
            },
          });
        }
      }
      console.log(`✅ Sequences and Shots created for ${project.code}`);
    }
  }

  console.log("\n🎉 Database seeding completed!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });