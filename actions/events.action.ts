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

    console.log("[createEvent] Session:", session?.user?.id, "Role:", session?.user?.role);

    if (!session || session.user.role !== Role.ADMIN) {
      console.log("[createEvent] Unauthorized - No session or not admin");
      return { success: false, error: "Unauthorized" };
    }

    console.log("[createEvent] Creating event:", eventData.name, "Category:", eventData.categoryId);

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

    console.log("[createEvent] Event created successfully:", event.id);

    revalidatePath("/admin/events");
    revalidatePath("/events");
    return { success: true, data: event };
  } catch (error) {
    console.error("[createEvent] Error creating event:", error);
    console.error("[createEvent] Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("[createEvent] Event data:", JSON.stringify(eventData, null, 2));
    return { success: false, error: error instanceof Error ? error.message : "Failed to create event" };
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

export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    return { success: true, user };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function registerGroupEvent(
  eventId: string,
  groupName: string,
  members: GroupMember[],
  mentorName?: string,
  mentorPhone?: string
) {
  console.log("registerGroupEvent started", { eventId, groupName, memberCount: members.length, mentorName });
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      console.log("registerGroupEvent: No session");
      return { success: false, error: "Please login to register for events" };
    }

    // Check approval status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isApproved: true }
    });

    if (!user?.isApproved) {
      return { success: false, error: "Please wait till admin approves your registration." };
    }
    console.log("registerGroupEvent: User logged in", session.user.id);

    // Validate that all members have an ID (meaning they are verified users)
    for (const member of members) {
      // Logic assumes frontend passes userId in 'collegeId' or a new field. 
      // User requested "fetched and added", so we should infer we have their IDs.
      // Let's assume the 'collegeId' field in GroupMember interface is being repurposed or we should rely on email lookup being trusted.
      // Better: The UI will look them up. We can lookup by email here to be sure.
      if (!member.email) {
        return { success: false, error: "All members must be valid users with emails." };
      }
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
        console.log("registerGroupEvent: Event found", event.name);

        if (event._count.registeredStudents + members.length >= event.participantLimit) { // + members.length to include team
          // Note: Logic might need 1 for lead + members. 
          // If 'members' includes lead, just length. If members are *other* people, lead + members.
          // Current UI implies "Total Team Size (Including You)", so members array usually excludes You? 
          // Need to align. Let's assume members array contains ONLY the added teammates.
        }

        // Strict check: Is event full?
        const totalNewRegistrants = 1 + members.length; // Lead + Teammates
        if (event._count.registeredStudents + totalNewRegistrants > event.participantLimit) {
          throw new Error(EVENT_FULL_ERROR);
        }

        // Check if Leader is already registered
        const existingRegistration = await tx.user.findFirst({
          where: {
            id: session.user.id,
            registeredEvents: { some: { id: eventId } },
          },
        });
        if (existingRegistration) {
          console.log("registerGroupEvent: Leader already registered");
          throw new Error("You are already registered for this event");
        }

        // Check if any Teammate is already registered
        // We need their IDs. Since we only have emails in the interface 'GroupMember' currently, we must fetch them.
        // It is better to resolve them to IDs first.
        const memberEmails = members.map(m => m.email);
        const registeredTeammates = await tx.user.findMany({
          where: {
            email: { in: memberEmails },
            registeredEvents: { some: { id: eventId } },
          },
        });

        if (registeredTeammates.length > 0) {
          throw new Error(`User ${registeredTeammates[0].name} (${registeredTeammates[0].email}) is already registered.`);
        }

        // 1. Register Team Lead
        await tx.user.update({
          where: { id: session.user.id },
          data: { registeredEvents: { connect: { id: eventId } } },
        });

        // 2. Register Teammates
        // We need the IDs of these users.
        const teamUsers = await tx.user.findMany({
          where: { email: { in: memberEmails } }
        });

        // Check if all exist
        if (teamUsers.length !== members.length) {
          throw new Error("One or more team members not found in the system. Please ensure they are registered.");
        }

        for (const user of teamUsers) {
          await tx.user.update({
            where: { id: user.id },
            data: { registeredEvents: { connect: { id: eventId } } },
          });
        }

        // 3. Create Group Registration
        // Store structured data in 'members' JSON.
        // We'll store: { userId, name, email, phone, college, collegeId }
        // We can fetch details from 'teamUsers' and merge with provided input if any.
        const enhancedMembers = teamUsers.map(u => ({
          userId: u.id,
          name: u.name,
          email: u.email,
          // phone, etc might not be in User model or might be. 
          // We can just store what we found in DB.
        }));

        await tx.groupRegistration.create({
          data: {
            eventId,
            userId: session.user.id,
            groupName: groupName || "Team",
            mentorName,
            mentorPhone,
            members: enhancedMembers as any, // Storing verified user details
          },
        });
        console.log("registerGroupEvent: Group registration created");

        // Re-check count after insert (optional but safe)
        // ...

        return { success: true };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidatePath("/events");
    revalidatePath("/profile");
    console.log("registerGroupEvent: Success");
    return { success: true, message: "Successfully registered team for event" };

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === EVENT_FULL_ERROR) return { success: false, error: "Event is full" };
      if (error.message === "Event not found") return { success: false, error: "Event not found" };
      if (error.message.includes("already registered")) return { success: false, error: error.message };
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

    // Check approval status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isApproved: true }
    });

    if (!user?.isApproved) {
      return { success: false, error: "Please wait till admin approves your registration." };
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isApproved: true,
        registeredEvents: {
          where: { id: eventId },
          select: { id: true }
        }
      }
    });

    return {
      success: true,
      isRegistered: !!(user?.registeredEvents.length),
      isApproved: !!user?.isApproved
    };
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
