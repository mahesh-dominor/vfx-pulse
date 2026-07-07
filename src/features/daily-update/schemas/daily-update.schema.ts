import { z } from "zod";

export const dailyUpdateSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  shotId: z.string().min(1, "Shot is required"),
  hoursWorked: z.coerce
    .number()
    .min(0, "Hours must be non-negative")
    .max(24, "Hours cannot exceed 24"),
  taskType: z.string().min(1, "Task type is required"),
  status: z.enum(["WIP", "INTERNAL_REVIEW", "CLIENT_REVIEW", "APPROVED", "BLOCKED"]),
  comments: z.string().max(2000, "Comments too long").optional().default(""),
});

export type DailyUpdateSchema = z.infer<typeof dailyUpdateSchema>;
