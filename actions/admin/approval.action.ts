"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { logAdminActivity } from "@/lib/admin-logs";

export type DeleteRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export async function getDeleteRequests(status?: "PENDING" | "ALL") {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized. Master only." };
    }

    const where = status === "PENDING" ? { status: "PENDING" } : {};

    const requests = await prisma.deleteRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: requests };
  } catch (e) {
    console.error("Error fetching delete requests:", e);
    return { success: false, error: "Failed to fetch requests" };
  }
}

export async function createDeleteRequest(params: {
  requestedById: string;
  requestedByEmail: string;
  requestedByName: string | null;
  requestedByRole: string;
  entityType: "CATEGORY" | "EVENT";
  entityId: string;
  entityName: string | null;
  categoryId?: string | null;
}) {
  try {
    const req = await prisma.deleteRequest.create({
      data: {
        requestedById: params.requestedById,
        requestedByEmail: params.requestedByEmail,
        requestedByName: params.requestedByName ?? undefined,
        requestedByRole: params.requestedByRole,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName ?? undefined,
        categoryId: params.categoryId ?? undefined,
        status: "PENDING",
      },
    });
    return { success: true, data: req };
  } catch (e) {
    console.error("Error creating delete request:", e);
    return { success: false, error: "Failed to create request" };
  }
}

export async function approveDeleteRequest(id: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized. Master only." };
    }

    const req = await prisma.deleteRequest.findUnique({ where: { id } });
    if (!req || req.status !== "PENDING") {
      return { success: false, error: "Request not found or already processed" };
    }

    if (req.entityType === "CATEGORY") {
      const cat = await prisma.category.findUnique({
        where: { id: req.entityId },
        include: { Event: true },
      });
      if (!cat) {
        await prisma.deleteRequest.update({
          where: { id },
          data: { status: "REJECTED", decidedById: session.user.id, decidedAt: new Date() },
        });
        return { success: false, error: "Category already deleted" };
      }
      if (cat.Event.length > 0) {
        await prisma.deleteRequest.update({
          where: { id },
          data: { status: "REJECTED", decidedById: session.user.id, decidedAt: new Date() },
        });
        return { success: false, error: "Category has events; delete events first" };
      }
      await prisma.category.delete({ where: { id: req.entityId } });
    } else {
      const event = await prisma.event.findUnique({ where: { id: req.entityId } });
      if (!event) {
        await prisma.deleteRequest.update({
          where: { id },
          data: { status: "REJECTED", decidedById: session.user.id, decidedAt: new Date() },
        });
        return { success: false, error: "Event already deleted" };
      }
      await prisma.event.delete({ where: { id: req.entityId } });
    }

    await prisma.deleteRequest.update({
      where: { id },
      data: { status: "APPROVED", decidedById: session.user.id, decidedAt: new Date() },
    });

    await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
      action: req.entityType === "CATEGORY" ? "DELETE_CATEGORY" : "DELETE_EVENT",
      entityType: req.entityType as "CATEGORY" | "EVENT",
      entityId: req.entityId,
      entityName: req.entityName ?? undefined,
      details: { viaApproval: true, requestId: id },
    });

    revalidatePath("/admin/approval");
    revalidatePath("/admin/competitions");
    revalidatePath("/competitions");
    revalidatePath("/events");
    revalidatePath("/admin/logs");
    return { success: true, message: `${req.entityType === "CATEGORY" ? "Category" : "Event"} deleted successfully` };
  } catch (e) {
    console.error("Error approving delete request:", e);
    return { success: false, error: "Failed to approve request" };
  }
}

export async function rejectDeleteRequest(id: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized. Master only." };
    }

    const req = await prisma.deleteRequest.findUnique({ where: { id } });
    if (!req || req.status !== "PENDING") {
      return { success: false, error: "Request not found or already processed" };
    }

    await prisma.deleteRequest.update({
      where: { id },
      data: { status: "REJECTED", decidedById: session.user.id, decidedAt: new Date() },
    });

    revalidatePath("/admin/approval");
    revalidatePath("/admin/logs");
    return { success: true, message: "Delete request rejected" };
  } catch (e) {
    console.error("Error rejecting delete request:", e);
    return { success: false, error: "Failed to reject request" };
  }
}
