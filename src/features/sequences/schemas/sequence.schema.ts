import { z } from "zod";

export const sequenceSchema = z.object({
  projectId: z.string().cuid(),
  code: z.string().trim().min(2, "Sequence code is required").transform(c => c.toUpperCase()),
  name: z.string().trim().min(2, "Sequence name is required"),
  episodeId: z.string().cuid().optional(),
  description: z.string().trim().optional(),
  sortOrder: z.number().optional().default(0),
});

export type SequenceSchema = z.infer<typeof sequenceSchema>;
