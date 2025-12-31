"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@/lib/generated/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const EVENT_FULL_ERROR = "EVENT_FULL";


export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        Event: {
          include: {
            registeredStudents: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                collage: true,
              },
            },
          },
          orderBy: {
            date: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}


export async function createCategory(name: string, image?: string, video?: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    if (!name || !name.trim()) {
      return { success: false, error: "Category name is required" };
    }

    const category = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        name: name.trim(),
        image: image || null,
        video: video || null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/events");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Failed to create category" };
  }
}


export async function updateCategory(id: string, name: string, image?: string, video?: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    if (!name || !name.trim()) {
      return { success: false, error: "Category name is required" };
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        image: image || null,
        video: video || null,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/events");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Failed to update category" };
  }
}


export async function deleteCategory(id: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }


    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        Event: true,
      },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    if (category.Event.length > 0) {
      return {
        success: false,
        error: "Cannot delete category with existing events",
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/admin/events");
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}






interface EventData {
  categoryId: string;
  name: string;
  description: string;
  date: string;
  image: string;
  venue: string;
  isGroupEvent: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  startTime: string;
  endTime: string;
  participantLimit: string;
  termsandconditions: string;
  registrationLink: string;
}

export async function createEvent(eventData: EventData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const event = await prisma.event.create({
      data: {
        id: crypto.randomUUID(),
        Category: {
          connect: { id: eventData.categoryId },
        },
        name: eventData.name,
        description: eventData.description,
        date: new Date(eventData.date),
        image: eventData.image,
        venue: eventData.venue,
        isGroupEvent: eventData.isGroupEvent,
        minTeamSize: eventData.minTeamSize,
        maxTeamSize: eventData.maxTeamSize,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        participantLimit: parseInt(eventData.participantLimit),
        termsandconditions: eventData.termsandconditions,
        registrationLink: eventData.registrationLink,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true, data: event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}


interface EventUpdateData {
  id: string,
  eventData: {
    categoryId: string;
    name: string;
    description: string;
    date: string;
    image: string;
    venue: string;
    isGroupEvent: boolean;
    minTeamSize: number;
    maxTeamSize: number;
    startTime: string;
    endTime: string;
    participantLimit: string;
    termsandconditions: string;
    registrationLink: string;
  }

}



export async function updateEvent({ id, eventData }: EventUpdateData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        Category: {
          connect: { id: eventData.categoryId },
        },
        name: eventData.name,
        description: eventData.description,
        date: new Date(eventData.date),
        image: eventData.image,
        venue: eventData.venue,
        isGroupEvent: eventData.isGroupEvent,
        minTeamSize: eventData.minTeamSize,
        maxTeamSize: eventData.maxTeamSize,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        participantLimit: parseInt(eventData.participantLimit),
        termsandconditions: eventData.termsandconditions,
        registrationLink: eventData.registrationLink,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true, data: event };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}


export async function deleteEvent(id: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || session.user.role !== Role.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.event.delete({
      where: { id },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true, message: "Event deleted successfully" };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}



interface GroupMember {
  name: string;
  college: string;
  collegeId: string;
  phone: string;
  email: string;
}

export async function registerGroupEvent(eventId: string, groupName: string, members: GroupMember[]) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to register for events" };
    }

    const registrationResult = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: eventId },
          include: {
            _count: {
              select: {
                registeredStudents: true,
              },
            },
          },
        });

        if (!event) {
          throw new Error("Event not found");
        }

        if (event._count.registeredStudents >= event.participantLimit) {
          throw new Error(EVENT_FULL_ERROR);
        }

        const existingRegistration = await tx.user.findFirst({
          where: {
            id: session.user.id,
            registeredEvents: {
              some: {
                id: eventId,
              },
            },
          },
        });

        if (existingRegistration) {
          throw new Error("You are already registered for this event");
        }

        // Register the user (Team Lead) to the event
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            registeredEvents: {
              connect: { id: eventId },
            },
          },
        });

        // Create Group Registration details
        await tx.groupRegistration.create({
          data: {
            eventId,
            userId: session.user.id,
            groupName: groupName || "Team",
            members: members as any,
          },
        });

        // Re-check count after insert
        const updated = await tx.event.findUnique({
          where: { id: eventId },
          select: {
            participantLimit: true,
            _count: {
              select: {
                registeredStudents: true,
              },
            },
          },
        });

        if (!updated || updated._count.registeredStudents > updated.participantLimit) {
          throw new Error(EVENT_FULL_ERROR);
        }

        return { success: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidatePath("/events");
    revalidatePath("/profile");
    return { success: true, message: "Successfully registered team for event" };

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === EVENT_FULL_ERROR) return { success: false, error: "Event is full" };
      if (error.message === "Event not found") return { success: false, error: "Event not found" };
      if (error.message === "You are already registered for this event") return { success: false, error: "You are already registered" };
    }
    console.error("Error registering group for event:", error);
    return { success: false, error: "Failed to register group" };
  }
}

export async function getPublicEvents() {
  try {
    const events = await prisma.event.findMany({
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
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function registerForEvent(eventId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to register for events" };
    }

    // Use transaction with serializable isolation to prevent race conditions
    const registrationResult = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: eventId },
          include: {
            _count: {
              select: {
                registeredStudents: true,
              },
            },
          },
        });

        if (!event) {
          return { success: false, error: "Event not found" };
        }

        if (event._count.registeredStudents >= event.participantLimit) {
          return { success: false, error: "Event is full" };
        }

        const existingRegistration = await tx.user.findFirst({
          where: {
            id: session.user.id,
            registeredEvents: {
              some: {
                id: eventId,
              },
            },
          },
        });

        if (existingRegistration) {
          return { success: false, error: "You are already registered for this event" };
        }

        await tx.user.update({
          where: { id: session.user.id },
          data: {
            registeredEvents: {
              connect: { id: eventId },
            },
          },
        });

        // Re-check count after insert to ensure we didn't exceed limit
        const updated = await tx.event.findUnique({
          where: { id: eventId },
          select: {
            participantLimit: true,
            _count: {
              select: {
                registeredStudents: true,
              },
            },
          },
        });

        if (!updated || updated._count.registeredStudents > updated.participantLimit) {
          throw new Error(EVENT_FULL_ERROR);
        }

        return { success: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (!registrationResult.success) {
      return registrationResult;
    }

    revalidatePath("/events");
    return { success: true, message: "Successfully registered for event" };
  } catch (error) {
    if (error instanceof Error && error.message === EVENT_FULL_ERROR) {
      return { success: false, error: "Event is full" };
    }
    console.error("Error registering for event:", error);
    return { success: false, error: "Failed to register for event" };
  }
}

export async function checkEventRegistration(eventId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: true, isRegistered: false };
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        registeredEvents: {
          some: {
            id: eventId,
          },
        },
      },
    });

    return { success: true, isRegistered: !!user };
  } catch (error) {
    console.error("Error checking registration:", error);
    return { success: false, error: "Failed to check registration" };
  }
}

export async function unregisterFromEvent(eventId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to unregister from events" };
    }

    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        registeredEvents: {
          some: {
            id: eventId,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "You are not registered for this event" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        registeredEvents: {
          disconnect: { id: eventId },
        },
      },
    });

    revalidatePath("/profile");
    revalidatePath("/events");
    return { success: true, message: "Successfully unregistered from event" };
  } catch (error) {
    console.error("Error unregistering from event:", error);
    return { success: false, error: "Failed to unregister from event" };
  }
}
