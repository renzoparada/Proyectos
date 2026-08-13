import { z } from "zod";

export const PROJECT_STATUSES = [
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export const projectStatusSchema = z.enum(PROJECT_STATUSES);

const optionalDate = z
  .string()
  .trim()
  .min(1)
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), "Fecha inválida")
  .nullable()
  .optional();

const optionalString = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

const optionalBudget = z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .nullable()
  .optional();

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  description: optionalString,
  client: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  status: projectStatusSchema.default("PLANNING"),
  budgetPlanned: optionalBudget,
  budgetSpent: optionalBudget,
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
