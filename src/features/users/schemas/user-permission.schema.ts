import { z } from "zod";

import { USER_PERMISSION_MODULES } from "@/constants/users";

export const userPermissionSchema = z.object({
  module: z.enum(USER_PERMISSION_MODULES),
  canView: z.coerce.boolean(),
  canCreate: z.coerce.boolean(),
  canUpdate: z.coerce.boolean(),
  canDelete: z.coerce.boolean(),
});

export type UserPermissionSchema = z.infer<typeof userPermissionSchema>;
