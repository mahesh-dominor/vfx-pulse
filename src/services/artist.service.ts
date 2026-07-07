import type { ArtistSchema } from "@/features/artists/schemas/artist.schema";
import { prisma } from "@/lib/prisma";

export const artistService = {
  async listArtists() {
    return prisma.artist.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
    });
  },

  async createArtist(input: ArtistSchema) {
    return prisma.artist.create({
      data: {
        employeeId: input.employeeId,
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phoneNumber: input.phoneNumber,
        designation: input.designation,
        department: input.department,
        joiningDate: new Date(input.joiningDate),
        isActive: input.isActive,
      },
    });
  },

  async updateArtist(id: string, input: ArtistSchema) {
    return prisma.artist.update({
      where: { id },
      data: {
        employeeId: input.employeeId,
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phoneNumber: input.phoneNumber,
        designation: input.designation,
        department: input.department,
        joiningDate: new Date(input.joiningDate),
        isActive: input.isActive,
      },
    });
  },

  async softDeleteArtist(id: string) {
    return prisma.artist.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  },
};
