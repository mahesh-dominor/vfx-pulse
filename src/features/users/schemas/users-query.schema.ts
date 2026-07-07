import { z } from "zod";

import { USER_ROLES } from "@/constants/users";

export const usersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(USER_ROLES).optional(),
  includeInactive: z.coerce.boolean().default(false),
});

export type UsersQuerySchema = z.infer<typeof usersQuerySchema>;
