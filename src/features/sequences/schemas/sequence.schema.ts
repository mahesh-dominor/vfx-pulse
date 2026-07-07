import { z } from "zod";

export const sequenceSchema = z.object({
  projectId: z.string().cuid(),
  code: z.string().trim().min(2, "Sequence code is required"),
  name: z.string().trim().min(2, "Sequence name is required"),
});

export type SequenceSchema = z.infer<typeof sequenceSchema>;
