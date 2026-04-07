import { prisma } from "@/lib/prisma";

export type LogAction =
  | "ADD_CATEGORY"
  | "EDIT_CATEGORY"
  | "DELETE_CATEGORY"
  | "ADD_EVENT"
  | "EDIT_EVENT"
  | "DELETE_EVENT"
  | "UPLOAD_CATEGORY_IMAGE"
  | "UPLOAD_EVENT_IMAGE"
  | "REQUEST_DELETE_CATEGORY"
  | "REQUEST_DELETE_EVENT"
  | "APPROVE_INDIVIDUAL_REGISTRATION"
  | "REJECT_INDIVIDUAL_REGISTRATION"
  | "APPROVE_GROUP_REGISTRATION"
  | "REJECT_GROUP_REGISTRATION"
  | "APPROVE_VISITOR_PASS"
  | "REJECT_VISITOR_PASS";

export type EntityType = "CATEGORY" | "EVENT" | "CATEGORY_IMAGE" | "EVENT_IMAGE" | "INDIVIDUAL_REGISTRATION" | "GROUP_REGISTRATION" | "VISITOR_PASS";

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
}

interface LogParams {
  action: LogAction;
  entityType: EntityType;
  entityId?: string | null;
  entityName?: string | null;
  details?: Record<string, unknown>;
}

export async function logAdminActivity(
  user: SessionUser,
  params: LogParams
): Promise<void> {
  try {
    await prisma.adminActivityLog.create({
      data: {
        userId: user.id,
        userEmail: user.email ?? "",
        userName: user.name ?? null,
        userRole: user.role,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        entityName: params.entityName ?? null,
        details: params.details ? (params.details as object) : undefined,
      },
    });
  } catch (e) {
    console.error("[logAdminActivity] Failed:", e);
  }
}
