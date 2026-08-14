import { z } from "zod";

export const USER_ROLES = ["ADMIN", "COLLABORATOR", "READ_ONLY"] as const;

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  email: z.string().trim().email("Email inválido").toLowerCase(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(USER_ROLES).default("COLLABORATOR"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  role: z.enum(USER_ROLES),
  // Empty/omitted means "leave the password as-is" — only hash+set it when non-empty.
  password: z.union([z.literal(""), z.string().min(8, "La contraseña debe tener al menos 8 caracteres")]).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
