import { z } from "zod";

export const pipelineStepSchema = z.object({
  code: z.string().trim().min(1).max(24),
  name: z.string().trim().min(1).max(80),
  durationDays: z.coerce.number().int().min(1).max(180),
  bufferDays: z.coerce.number().int().min(0).max(90).default(0),
  parallelGroup: z.string().trim().min(1).max(40).optional(),
});

export const reverseScheduleSchema = z.object({
  finalDeliveryDate: z.string().datetime(),
  includeWeekends: z.boolean().default(false),
  holidays: z.array(z.string().datetime()).default([]),
  steps: z.array(pipelineStepSchema).min(1).max(24),
});

export const capacityQuerySchema = z.object({
  targetDays: z.coerce.number().int().min(1).max(60).default(8),
  forecastStartDate: z.string().datetime().optional(),
  projectId: z.string().cuid().optional(),
});

export const planningSnapshotCreateSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(2000).optional(),
  finalDeliveryDate: z.string().datetime(),
  includeWeekends: z.boolean().default(false),
  holidays: z.array(z.string().datetime()).default([]),
  steps: z.array(pipelineStepSchema).min(1).max(24),
});

export const planningSnapshotQuerySchema = z.object({
  projectId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ReverseScheduleSchema = z.infer<typeof reverseScheduleSchema>;
export type CapacityQuerySchema = z.infer<typeof capacityQuerySchema>;
export type PlanningSnapshotCreateSchema = z.infer<typeof planningSnapshotCreateSchema>;
export type PlanningSnapshotQuerySchema = z.infer<typeof planningSnapshotQuerySchema>;
