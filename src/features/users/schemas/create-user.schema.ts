import { z } from "zod";

import {
  USER_DEPARTMENTS,
  USER_DESIGNATIONS,
  USER_ROLES,
} from "@/constants/users";
import { userPermissionSchema } from "@/features/users/schemas/user-permission.schema";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(USER_ROLES),
  designation: z.enum(USER_DESIGNATIONS),
  department: z.enum(USER_DEPARTMENTS),
  isActive: z.coerce.boolean().default(true),
  teamIds: z.array(z.string().cuid()).default([]),
  permissionOverrides: z.array(userPermissionSchema).default([]),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
