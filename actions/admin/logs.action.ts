"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export async function getActivityLogs(filters?: {
  userId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized. Master only." };
    }

    const limit = Math.min(filters?.limit ?? 100, 500);
    const offset = filters?.offset ?? 0;

    const where: { userId?: string; action?: string } = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.adminActivityLog.count({ where }),
    ]);

    return { success: true, data: logs, total };
  } catch (e) {
    console.error("Error fetching activity logs:", e);
    return { success: false, error: "Failed to fetch logs" };
  }
}
