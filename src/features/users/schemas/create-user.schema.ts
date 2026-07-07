import { z } from "zod";

import { USER_ROLES } from "@/constants/users";
import { userPermissionSchema } from "@/features/users/schemas/user-permission.schema";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(USER_ROLES),
  isActive: z.coerce.boolean().default(true),
  teamIds: z.array(z.string().cuid()).default([]),
  permissionOverrides: z.array(userPermissionSchema).default([]),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
