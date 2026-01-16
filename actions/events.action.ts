"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const EVENT_FULL_ERROR = "EVENT_FULL";

// Helper to generate slug
function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}


export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        Event: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true,
            date: true,
            venue: true,
            startTime: true,
            endTime: true,
            participantLimit: true,
            isGroupEvent: true,
            minTeamSize: true,
            maxTeamSize: true,
            registrationLink: true,
            whatsappLink: true,
            termsandconditions: true,
            categoryId: true,
            registeredStudents: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                collage: true,
                branch: true,
                year: true,
                collageId: true,
              },
            },
            submissions: {
              select: {
                id: true,
                userId: true,
                submissionLink: true,
                notes: true,
              },
            },
            groupRegistrations: {
              select: {
                id: true,
                groupName: true,
                mentorName: true,
                mentorPhone: true,
                members: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    collage: true,
                    collageId: true,
                  }
                }
              }
            }
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

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!name || !name.trim()) {
      return { success: false, error: "Category name is required" };
    }

    const category = await prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        name: name.trim(),
        slug: generateSlug(name),
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

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!name || !name.trim()) {
      return { success: false, error: "Category name is required" };
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: generateSlug(name),
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

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
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
  whatsappLink?: string;
}

export async function createEvent(eventData: EventData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    console.log("[createEvent] Session:", session?.user?.id, "Role:", session?.user?.role);

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      console.log("[createEvent] Unauthorized - No session or not admin/manager");
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
        slug: generateSlug(eventData.name),
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
        whatsappLink: eventData.whatsappLink || null,
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
    whatsappLink?: string;
  }

}



export async function updateEvent({ id, eventData }: EventUpdateData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      return { success: false, error: "Unauthorized" };
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        Category: {
          connect: { id: eventData.categoryId },
        },
        name: eventData.name,
        slug: generateSlug(eventData.name),
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
        whatsappLink: eventData.whatsappLink || null,
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

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
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
  phone: string;
  gender: string;
}

export async function getUserByEmail(email: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

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
  mentorPhone?: string,
  registrationDetails?: any
) {
  console.log("registerGroupEvent started", { eventId, groupName, memberCount: members.length, mentorName, registrationDetails });
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

        // Strict check: Is event full?
        // Count registrations + new team size (Lead + Members)
        // Note: registeredStudents count tracks individual Users registered.
        // For Group Event, we are only registering the Lead as a 'User' relation.
        // So technologically, the event participant count might not reflect team size if we only link the Lead.
        // HOWEVER, to keep it simple and consistent with "participantLimit":
        // We should arguably count the TEAM SIZE against the limit.
        // But the `registeredStudents` relation is User[].
        // If we don't register teammates as Users, `event._count.registeredStudents` will only increase by 1 (Lead).
        // This is a trade-off. We should probably stick to checking if we have space, but we can't easily increment the counter by 5 if only 1 user relation exists.
        // REQUIRED FIX: If we want accurate limits, we should rely on GroupRegistration calculation or accept that 'registeredStudents' = 'Teams Registered'.
        // Let's assume for now `participantLimit` for group events means "Number of Teams".
        // If it means "Number of People", we are breaking that tracking by not creating User records.
        // Let's assume it means "Number of Teams" or "Number of Leads".

        if (event._count.registeredStudents >= event.participantLimit) {
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

        // 1. Register Team Lead
        await tx.user.update({
          where: { id: session.user.id },
          data: { registeredEvents: { connect: { id: eventId } } },
        });

        // 2. Create Group Registration
        // Store structured data in 'members' JSON.
        // We ensure members array is stored directly
        await tx.groupRegistration.create({
          data: {
            eventId,
            userId: session.user.id,
            groupName: groupName || "Team",
            mentorName,
            mentorPhone,
            members: members as any, // Storing manual details
            registrationDetails: registrationDetails || undefined
          },
        });
        console.log("registerGroupEvent: Group registration created");

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

// Helper to get Event by Slug
export async function getEventBySlug(slug: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        Category: true,
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

    return { success: true, data: event };
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return { success: false, error: "Failed to fetch event" };
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

export async function registerForEvent(eventId: string, registrationDetails?: any) {
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

        // Check if user already has an Individual Registration (explicit check)
        const existingIndividualReg = await tx.individualRegistration.findUnique({
          where: {
            userId_eventId: {
              userId: session.user.id,
              eventId: eventId
            }
          }
        });

        if (existingIndividualReg) {
          return { success: false, error: "You are already registered for this event" };
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

        // Create Individual Registration Record
        await tx.individualRegistration.create({
          data: {
            userId: session.user.id,
            eventId: eventId,
            registrationDetails: registrationDetails || undefined
          }
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

        // If registration details are provided (for solo events), create an EventSubmission or similar record
        // Since we don't have a direct field on the relation, we'll use EventSubmission as a workaround storage if needed
        if (registrationDetails) {
          await tx.eventSubmission.upsert({
            where: {
              userId_eventId: {
                userId: session.user.id,
                eventId: eventId
              }
            },
            create: {
              userId: session.user.id,
              eventId: eventId,
              submissionLink: "", // Placeholder
              notes: "Registration Details",
              registrationDetails: registrationDetails
            },
            update: {
              registrationDetails: registrationDetails
            }
          });
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

export async function getUserRegistrations() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: true, registeredEventIds: [], isApproved: false };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isApproved: true,
        registeredEvents: {
          select: { id: true }
        }
      }
    });

    return {
      success: true,
      registeredEventIds: user?.registeredEvents.map(e => e.id) || [],
      isApproved: !!user?.isApproved
    };
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    return { success: false, error: "Failed to fetch registrations" };
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
