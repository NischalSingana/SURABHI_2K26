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
  dateFrom?: Date;
  dateTo?: Date;
  todayOnly?: boolean;
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized. Master only." };
    }

    const limit = Math.min(filters?.limit ?? 100, 500);
    const offset = filters?.offset ?? 0;

    const where: {
      userId?: string;
      action?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;

    // Handle date filtering
    if (filters?.todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.createdAt = {
        gte: today,
        lte: tomorrow,
      };
    } else if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        where.createdAt.gte = from;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

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
