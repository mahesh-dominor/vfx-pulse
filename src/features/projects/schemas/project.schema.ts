import { z } from "zod";

export const projectPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name is required"),
  code: z.string().trim().min(2, "Project code is required"),
  description: z.string().trim().max(2000).optional(),
  client: z.string().trim().max(200).optional(),
  productionHouse: z.string().trim().max(200).optional(),
  priority: projectPrioritySchema.default("MEDIUM"),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]),
  producerId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  deliveryDate: z.string().datetime().optional(),
  fps: z.coerce.number().int().positive().optional(),
  resolution: z.string().trim().max(40).optional(),
  colorSpace: z.string().trim().max(80).optional(),
});

export type ProjectSchema = z.infer<typeof projectSchema>;
