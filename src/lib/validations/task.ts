import { z } from "zod";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/task-meta";

const requiredDate = z
  .string()
  .trim()
  .min(1, "La fecha es obligatoria")
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), "Fecha inválida");

const optionalString = z
  .string()
  .trim()
  .max(2000)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

const optionalId = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

export const taskInputSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
    description: optionalString,
    startDate: requiredDate,
    endDate: requiredDate,
    progress: z.coerce.number().int().min(0).max(100).default(0),
    status: z.enum(TASK_STATUSES).default("TODO"),
    priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
    isMilestone: z.boolean().default(false),
    assigneeId: optionalId,
    dependsOnTaskIds: z.array(z.string()).default([]),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  });

export type TaskInput = z.infer<typeof taskInputSchema>;

// Used for drag/resize on the Gantt: only dates move, everything else is untouched.
export const taskDateUpdateSchema = z
  .object({
    startDate: requiredDate,
    endDate: requiredDate,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
  });

export const taskStatusUpdateSchema = z.object({
  status: z.enum(TASK_STATUSES),
});
