import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function logActivity(params: {
  entityType: string;
  entityId: string;
  action: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId ?? null,
      metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}
