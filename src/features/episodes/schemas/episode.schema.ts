import { z } from "zod";

export const episodeSchema = z.object({
  code: z.string().trim().min(1, "Episode code is required").transform(c => c.toUpperCase()),
  projectId: z.string().cuid(),
  sortOrder: z.number().optional().default(0),
});

export type EpisodeSchema = z.infer<typeof episodeSchema>;
