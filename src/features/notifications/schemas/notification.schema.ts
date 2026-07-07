import { z } from "zod";

export const notificationSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().trim().min(2),
  message: z.string().trim().min(2).max(2000),
  channel: z.enum(["IN_APP", "EMAIL"]).default("IN_APP"),
});

export type NotificationSchema = z.infer<typeof notificationSchema>;
