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
  state?: string;
  city?: string;
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
        individualRegistrations: true,
        groupRegistrations: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Map status to events
    const eventsWithStatus = user.registeredEvents.map(event => {
      // Check individual registration
      const individualReg = user.individualRegistrations.find(r => r.eventId === event.id);
      if (individualReg) {
        return { ...event, registrationStatus: individualReg.paymentStatus };
      }

      // Check group registration
      const groupReg = user.groupRegistrations.find(r => r.eventId === event.id);
      if (groupReg) {
        return { ...event, registrationStatus: groupReg.paymentStatus };
      }

      // Fallback: If no explicit record found but relation exists, assume APPROVED (e.g. KL students auto-linked without extra record logic initially, or legacy)
      // However, if we want to be strict, we could check isKLStudent. 
      // For now, defaulting to APPROVED if connected is safest for old data, but PENDING is safer for new.
      // Given the logic, let's assume APPROVED if they are in the list, unless explicit record says PENDING.
      return { ...event, registrationStatus: "APPROVED" };
    });

    return { success: true, data: eventsWithStatus };
  } catch (error) {
    console.error("Error fetching registered events:", error);
    return { success: false, error: "Failed to fetch registered events" };
  }
}
