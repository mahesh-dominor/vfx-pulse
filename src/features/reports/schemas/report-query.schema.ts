import { z } from "zod";

export const reportQuerySchema = z.object({
  type: z.enum([
    "project-progress",
    "shot-status-summary",
    "artist-workload",
    "department-progress",
    "time-log",
    "task-completion",
    "shot-progress",
    "artist-utilization",
    "department-utilization",
    "weekly",
    "monthly",
    "client",
  ]),
  projectId: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type ReportQuerySchema = z.infer<typeof reportQuerySchema>;
