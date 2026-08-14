import { z } from "zod";
import { RISK_CATEGORIES, RISK_STATUSES } from "@/lib/risk-meta";

const optionalString = z
  .string()
  .trim()
  .max(4000)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

const optionalId = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

export const riskInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  description: optionalString,
  category: z.enum(RISK_CATEGORIES).default("OTHER"),
  probability: z.coerce.number().int().min(1, "Debe ser entre 1 y 5").max(5, "Debe ser entre 1 y 5"),
  impact: z.coerce.number().int().min(1, "Debe ser entre 1 y 5").max(5, "Debe ser entre 1 y 5"),
  status: z.enum(RISK_STATUSES).default("IDENTIFIED"),
  mitigationPlan: optionalString,
  ownerId: optionalId,
});

export type RiskInput = z.infer<typeof riskInputSchema>;

export const riskStatusUpdateSchema = z.object({
  status: z.enum(RISK_STATUSES),
});
