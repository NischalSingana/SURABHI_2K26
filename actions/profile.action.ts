"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";


interface RegistrationData {
  name?: string;
  image?: string;
  phone?: string;
  collage?: string;
  collageId?: string;
  branch?: string;
  year?: number;
  gender?: string;
}

export async function updateProfile(data: RegistrationData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/profile");
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}


export async function getMyRegisteredEvents() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        registeredEvents: {
          include: {
            Category: true,
            _count: {
              select: {
                registeredStudents: true,
              },
            },
          },
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user.registeredEvents };
  } catch (error) {
    console.error("Error fetching registered events:", error);
    return { success: false, error: "Failed to fetch registered events" };
  }
}
