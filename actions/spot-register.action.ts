"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { registerUserByAdmin } from "@/actions/events.action";
import { logAdminActivity } from "@/lib/admin-logs";

const ALLOWED_ROLES = [Role.ADMIN, Role.MASTER, Role.MANAGER];

export interface UserFullDetails {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  collage: string | null;
  collageId: string | null;
  branch: string | null;
  year: number | null;
  gender: string | null;
  state: string | null;
  city: string | null;
  country: string | null;
  isInternational: boolean | null;
}

export async function getUserFullByEmail(email: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || !(ALLOWED_ROLES as readonly string[]).includes(session.user.role as string)) {
      return { success: false, error: "Unauthorized" };
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return { success: false, error: "Email is required" };

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        collage: true,
        collageId: true,
        branch: true,
        year: true,
        gender: true,
        state: true,
        city: true,
        country: true,
        isInternational: true,
      },
    });
    return { success: true, user };
  } catch (error) {
    console.error("getUserFullByEmail error:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function updateSpotRegisterUserDetails(
  userId: string,
  details: {
    name?: string | null;
    phone?: string | null;
    collage?: string | null;
    collageId?: string | null;
    branch?: string | null;
    year?: number | null;
    gender?: string | null;
    state?: string | null;
    city?: string | null;
    country?: string | null;
  }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || !(ALLOWED_ROLES as readonly string[]).includes(session.user.role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: details.name?.trim() || undefined,
        phone: details.phone?.trim() || undefined,
        collage: details.collage?.trim() || undefined,
        collageId: details.collageId?.trim() || undefined,
        branch: details.branch?.trim() || undefined,
        year: details.year ?? undefined,
        gender: details.gender?.trim() || undefined,
        state: details.state?.trim() || undefined,
        city: details.city?.trim() || undefined,
        country: details.country?.trim() || undefined,
      },
    });
    return { success: true, message: "User details saved." };
  } catch (error) {
    console.error("updateSpotRegisterUserDetails error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update" };
  }
}

/** Creates a new user with email+password via Better Auth so they can log in. For spot-register when user not found. */
export async function createSpotRegisterUserWithPassword(
  email: string,
  password: string,
  details: {
    name: string;
    phone: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    college: string;
    collageId?: string;
    branch?: string;
    year?: number;
    state?: string;
    city?: string;
    country?: string;
  }
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user || !(ALLOWED_ROLES as readonly string[]).includes(session.user.role as string)) {
      return { success: false, error: "Unauthorized" };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { success: false, error: "Invalid email" };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }
    if (!details.name?.trim()) {
      return { success: false, error: "Name is required" };
    }

    const mappedGender =
      details.gender === "FEMALE" ? "Female" : details.gender === "OTHER" ? "Other" : "Male";

    const { user } = await auth.api.createUser({
      body: {
        email: normalizedEmail,
        password,
        name: details.name.trim(),
        data: {
          phone: details.phone.trim() || undefined,
          collage: details.college.trim() || undefined,
          collageId: details.collageId?.trim() || undefined,
          branch: details.branch?.trim() || undefined,
          year: details.year ?? undefined,
          gender: mappedGender,
          state: details.state?.trim() || undefined,
          city: details.city?.trim() || undefined,
          country: details.country?.trim() || undefined,
          isApproved: true,
        },
      },
      headers: headersList,
    });

    if (!user) {
      return { success: false, error: "Failed to create user" };
    }

    await logAdminActivity(session.user, {
      action: "SPOT_REGISTER_CREATE_USER",
      entityType: "USER",
      entityId: user.id,
      entityName: details.name.trim(),
      details: { targetEmail: normalizedEmail, source: "spot-register", college: details.college },
    });

    return { success: true, userId: user.id };
  } catch (error: unknown) {
    const msg = error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message)
      : "Failed to create user";
    if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("email")) {
      return { success: false, error: "A user with this email already exists" };
    }
    console.error("createSpotRegisterUserWithPassword error:", error);
    return { success: false, error: msg };
  }
}

export async function spotRegisterUser(
  targetEmail: string,
  eventId: string,
  paymentDetails: {
    paymentScreenshot: string;
    utrId: string;
    payeeName: string;
  },
  groupDetails?: {
    groupName: string;
    members: { name: string; gender: string }[];
    teamLeadPhone: string;
  },
  options?: {
    isVirtual?: boolean;
    createUserIfNotFound?: boolean;
    manualLeadName?: string;
    manualLeadPhone?: string;
    manualLeadGender?: "MALE" | "FEMALE" | "OTHER";
    manualCollegeName?: string;
  }
) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user || !(ALLOWED_ROLES as readonly string[]).includes(session.user.role as string)) {
    return { success: false, error: "Unauthorized" };
  }

  const membersForAdmin = groupDetails?.members.map((m) => ({
    name: m.name.trim(),
    gender: m.gender.trim(),
    phone: groupDetails.teamLeadPhone,
  })) ?? [];

  return registerUserByAdmin(
    targetEmail,
    eventId,
    paymentDetails,
    groupDetails
      ? {
          groupName: groupDetails.groupName.trim(),
          members: membersForAdmin,
          mentorName: undefined,
          mentorPhone: undefined,
        }
      : undefined,
    {
      isVirtual: options?.isVirtual,
      createUserIfNotFound: options?.createUserIfNotFound ?? true,
      manualLeadName: options?.manualLeadName?.trim(),
      manualLeadPhone: options?.manualLeadPhone?.trim() || groupDetails?.teamLeadPhone,
      manualLeadGender: options?.manualLeadGender,
      manualCollegeName: options?.manualCollegeName?.trim() || "Spot Registration",
      allowManager: true,
    }
  );
}
