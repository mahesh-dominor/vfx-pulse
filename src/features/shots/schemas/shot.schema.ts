import { z } from "zod";

export const shotSchema = z.object({
  projectId: z.string().cuid(),
  sequenceId: z.string().cuid(),
  artistId: z.string().cuid().optional(),
  code: z.string().trim().min(1).optional(),
  shotName: z.string().trim().min(2, "Shot name is required"),
  description: z.string().trim().max(2000).optional(),
  status: z.enum([
    "NOT_STARTED",
    "WIP",
    "INTERNAL_REVIEW",
    "CLIENT_REVIEW",
    "APPROVED",
    "DELIVERED",
    "HOLD",
  ]),
  priority: z.coerce.number().int().min(1).max(5).default(3),
  version: z.coerce.number().int().min(1).default(1),
  dueDate: z.string().datetime().optional(),
  bidDays: z.coerce.number().nonnegative().optional(),
  actualDays: z.coerce.number().nonnegative().optional(),
  frameStart: z.coerce.number().int().nonnegative().optional(),
  frameEnd: z.coerce.number().int().nonnegative().optional(),
});

export type ShotSchema = z.infer<typeof shotSchema>;
