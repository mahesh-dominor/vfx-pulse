import { z } from "zod";

export const timeLogSchema = z.object({
  logDate: z.string().datetime(),
  projectId: z.string().cuid(),
  shotId: z.string().cuid(),
  taskId: z.string().cuid(),
  artistId: z.string().cuid(),
  activity: z.string().trim().min(2, "Activity is required"),
  minutesSpent: z.coerce.number().int().min(1, "Time spent is required"),
  status: z.enum([
    "NOT_STARTED",
    "IN_PROGRESS",
    "ON_HOLD",
    "REVIEW",
    "COMPLETED",
  ]),
  notes: z.string().trim().max(2000).optional(),
});

export type TimeLogSchema = z.infer<typeof timeLogSchema>;
