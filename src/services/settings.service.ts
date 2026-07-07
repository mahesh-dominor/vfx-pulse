import {
  departmentSettingSchema,
  prioritySettingSchema,
  statusSettingSchema,
  studioSettingSchema,
} from "@/features/settings/schemas/settings.schema";
import { prisma } from "@/lib/prisma";

export const settingsService = {
  async listAll() {
    const [studio, departments, statuses, priorities] = await Promise.all([
      prisma.studioSetting.findMany({ where: { deletedAt: null }, orderBy: { key: "asc" } }),
      prisma.departmentSetting.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
      prisma.statusSetting.findMany({ where: { deletedAt: null }, orderBy: [{ module: "asc" }, { name: "asc" }] }),
      prisma.prioritySetting.findMany({ where: { deletedAt: null }, orderBy: [{ module: "asc" }, { level: "asc" }] }),
    ]);

    return { studio, departments, statuses, priorities };
  },

  async upsertStudioSetting(input: unknown) {
    const parsed = studioSettingSchema.parse(input);

    return prisma.studioSetting.upsert({
      where: { key: parsed.key },
      update: { value: parsed.value, deletedAt: null },
      create: { key: parsed.key, value: parsed.value },
    });
  },

  async createDepartment(input: unknown) {
    const parsed = departmentSettingSchema.parse(input);

    return prisma.departmentSetting.create({
      data: parsed,
    });
  },

  async updateDepartment(id: string, input: unknown) {
    const parsed = departmentSettingSchema.parse(input);

    return prisma.departmentSetting.update({
      where: { id },
      data: parsed,
    });
  },

  async softDeleteDepartment(id: string) {
    return prisma.departmentSetting.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  async createStatus(input: unknown) {
    const parsed = statusSettingSchema.parse(input);

    return prisma.statusSetting.create({
      data: parsed,
    });
  },

  async updateStatus(id: string, input: unknown) {
    const parsed = statusSettingSchema.parse(input);

    return prisma.statusSetting.update({
      where: { id },
      data: parsed,
    });
  },

  async softDeleteStatus(id: string) {
    return prisma.statusSetting.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  async createPriority(input: unknown) {
    const parsed = prioritySettingSchema.parse(input);

    return prisma.prioritySetting.create({
      data: parsed,
    });
  },

  async updatePriority(id: string, input: unknown) {
    const parsed = prioritySettingSchema.parse(input);

    return prisma.prioritySetting.update({
      where: { id },
      data: parsed,
    });
  },

  async softDeletePriority(id: string) {
    return prisma.prioritySetting.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },
};
