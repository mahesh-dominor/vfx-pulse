import { z } from "zod";

export const assetSchema = z.object({
  projectId: z.string().cuid(),
  shotId: z.string().cuid().optional(),
  name: z.string().trim().min(2),
  assetType: z.enum(["REFERENCE", "HDRI", "TEXTURE", "MODEL", "CAMERA", "OTHER"]),
  fileUrl: z.url("Invalid URL"),
  version: z.coerce.number().int().min(1).default(1),
});

export type AssetSchema = z.infer<typeof assetSchema>;
