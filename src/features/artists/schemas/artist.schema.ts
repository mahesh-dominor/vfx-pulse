import { z } from "zod";

export const artistSchema = z.object({
  employeeId: z.string().trim().min(2, "Employee ID is required"),
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phoneNumber: z.string().trim().optional(),
  designation: z.enum([
    "JUNIOR_ARTIST",
    "MID_ARTIST",
    "SENIOR_ARTIST",
    "LEAD",
    "SUPERVISOR",
  ]),
  department: z.enum([
    "PREP",
    "MATCHMOVE",
    "LAYOUT",
    "ANIMATION",
    "FX",
    "LIGHTING",
    "COMPOSITING",
    "ROTO",
    "PAINT",
    "QC",
    "PRODUCTION",
  ]),
  joiningDate: z.string().datetime(),
  isActive: z.coerce.boolean().default(true),
});

export type ArtistSchema = z.infer<typeof artistSchema>;
