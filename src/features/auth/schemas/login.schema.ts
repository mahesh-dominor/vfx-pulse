import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
