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
  country?: string;
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
        individualRegistrations: {
          include: {
            event: {
              include: {
                Category: true,
                _count: {
                  select: {
                    individualRegistrations: true,
                    groupRegistrations: true,
                  },
                },
              },
            },
          },
        },
        groupRegistrations: {
          include: {
            event: {
              include: {
                Category: true,
                _count: {
                  select: {
                    individualRegistrations: true,
                    groupRegistrations: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Combine and format events
    const individualEvents = user.individualRegistrations.map(reg => ({
      ...reg.event,
      registrationStatus: reg.paymentStatus as any
    }));

    const groupEvents = user.groupRegistrations.map(reg => ({
      ...reg.event,
      registrationStatus: reg.paymentStatus as any
    }));

    // Find groups where user is a member but not the leader
    const memberInGroups = await prisma.groupRegistration.findMany({
      where: {
        members: {
          array_contains: [{ email: session.user.email }]
        },
        userId: { not: session.user.id } // Already covered in groupEvents as leader
      },
      include: {
        event: {
          include: {
            Category: true,
            _count: {
              select: {
                individualRegistrations: true,
                groupRegistrations: true,
              },
            },
          },
        },
      }
    });

    const memberEvents = memberInGroups.map((reg: any) => ({
      ...reg.event,
      registrationStatus: reg.paymentStatus as any
    }));

    // deduplicate events
    const allEvents = [...individualEvents, ...groupEvents, ...memberEvents];
    const uniqueEventsMap = new Map();
    allEvents.forEach(e => {
      uniqueEventsMap.set(e.id, e);
    });

    const uniqueEvents = Array.from(uniqueEventsMap.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return { success: true, data: uniqueEvents };
  } catch (error) {
    console.error("Error fetching registered events:", error);
    return { success: false, error: "Failed to fetch registered events" };
  }
}
