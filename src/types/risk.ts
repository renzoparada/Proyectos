import type { RiskCategory, RiskStatus } from "@/lib/risk-meta";

export type RiskDTO = {
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  name: string;
  description: string | null;
  category: RiskCategory;
  probability: number;
  impact: number;
  severity: number;
  status: RiskStatus;
  mitigationPlan: string | null;
  ownerId: string | null;
  owner?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
};
