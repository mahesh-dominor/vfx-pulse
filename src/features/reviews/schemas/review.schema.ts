import { z } from "zod";

export const reviewSchema = z.object({
  shotId: z.string().cuid(),
  reviewType: z.enum(["INTERNAL", "CLIENT"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "APPROVED", "REJECTED"]).default("OPEN"),
  title: z.string().trim().min(2),
  description: z.string().trim().max(2000).optional(),
});

export type ReviewSchema = z.infer<typeof reviewSchema>;
