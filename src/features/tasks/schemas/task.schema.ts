import { z } from "zod";

export const taskSchema = z.object({
  projectId: z.string().cuid(),
  shotId: z.string().cuid(),
  artistId: z.string().cuid(),
  taskName: z.string().trim().min(2, "Task name is required"),
  description: z.string().trim().max(2000).optional(),
  estimatedMinutes: z.coerce.number().int().positive().optional(),
  status: z.enum([
    "NOT_STARTED",
    "IN_PROGRESS",
    "ON_HOLD",
    "REVIEW",
    "COMPLETED",
  ]),
});

export type TaskSchema = z.infer<typeof taskSchema>;
