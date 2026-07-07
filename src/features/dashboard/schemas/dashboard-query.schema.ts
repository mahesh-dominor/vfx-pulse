import { z } from "zod";

export const dashboardQuerySchema = z.object({
  recentActivityLimit: z.coerce.number().int().min(1).max(50).default(10),
  assignedShotsLimit: z.coerce.number().int().min(1).max(20).default(8),
});

export type DashboardQuerySchema = z.infer<typeof dashboardQuerySchema>;
