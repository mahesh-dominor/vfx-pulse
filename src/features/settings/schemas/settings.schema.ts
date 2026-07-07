import { z } from "zod";

export const studioSettingSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export const departmentSettingSchema = z.object({
  name: z.string().trim().min(2),
  code: z.string().trim().min(2),
  isActive: z.coerce.boolean().default(true),
});

export const statusSettingSchema = z.object({
  module: z.string().trim().min(1),
  name: z.string().trim().min(1),
  colorHex: z.string().trim().optional(),
  isActive: z.coerce.boolean().default(true),
});

export const prioritySettingSchema = z.object({
  module: z.string().trim().min(1),
  name: z.string().trim().min(1),
  level: z.coerce.number().int().min(1),
  isActive: z.coerce.boolean().default(true),
});
