"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/lib/admin-logs";
import { createDeleteRequest } from "@/actions/admin/approval.action";

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



export async function deleteRegistration(id: string, type: 'INDIVIDUAL' | 'GROUP') {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || session.user.role !== Role.MASTER) {
      return { success: false, error: "Unauthorized. Only MASTER can delete registrations." };
    }

    if (type === 'INDIVIDUAL') {
      await prisma.individualRegistration.delete({
        where: { id }
      });
      // Also check if there's a corresponding EventSubmission and delete it if needed, or rely on cascade? 
      // IndividualRegistration doesn't cascade to EventSubmission based on schema.
      // But let's stick to core request: delete the registration record.
    } else {
      await prisma.groupRegistration.delete({
        where: { id }
      });
    }

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath("/profile");
    revalidatePath("/profile/competitions");
    revalidatePath("/competitions");

    return { success: true, message: "Registration deleted successfully" };
  } catch (error) {
    console.error("Error deleting registration:", error);
    return { success: false, error: "Failed to delete registration" };
  }
}

export async function getCategories(includeFullData: boolean = true): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    if (includeFullData) {
      // Full data for admin pages
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
              allowSubmissions: true,
              virtualEnabled: true,
              minTeamSize: true,
              maxTeamSize: true,
              registrationLink: true,
              whatsappLink: true,
              brochureLink: true,
              termsandconditions: true,
              categoryId: true,
              _count: {
                select: {
                  individualRegistrations: true,
                  groupRegistrations: true,
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
              individualRegistrations: {
                select: {
                  id: true,
                  paymentStatus: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                      collage: true,
                      collageId: true,
                      branch: true,
                      year: true,
                      state: true,
                      city: true,
                      isInternational: true,
                      country: true,
                    }
                  }
                }
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
                      state: true,
                      city: true,
                      isInternational: true,
                      country: true,
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
    } else {
      // Lightweight data for public pages
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          video: true,
          Event: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              categoryId: true,
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
    }
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

    await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
      action: "ADD_CATEGORY",
      entityType: "CATEGORY",
      entityId: category.id,
      entityName: category.name,
    });

    revalidatePath("/admin/events");
    revalidatePath("/competitions");
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

    await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
      action: "EDIT_CATEGORY",
      entityType: "CATEGORY",
      entityId: category.id,
      entityName: category.name,
      details: { imageChanged: !!image, videoChanged: !!video },
    });

    revalidatePath("/admin/events");
    revalidatePath("/competitions");
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
      include: { Event: true },
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

    const isMaster = session.user.role === Role.MASTER;

    if (isMaster) {
      await prisma.category.delete({ where: { id } });
      await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
        action: "DELETE_CATEGORY",
        entityType: "CATEGORY",
        entityId: category.id,
        entityName: category.name,
      });
      revalidatePath("/admin/events");
      revalidatePath("/competitions");
      return { success: true, message: "Category deleted successfully" };
    }

    const createResult = await createDeleteRequest({
      requestedById: session.user.id,
      requestedByEmail: session.user.email ?? "",
      requestedByName: session.user.name ?? null,
      requestedByRole: session.user.role,
      entityType: "CATEGORY",
      entityId: category.id,
      entityName: category.name,
      categoryId: null,
    });

    if (!createResult.success) {
      return { success: false, error: createResult.error ?? "Failed to submit delete request" };
    }

    await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
      action: "REQUEST_DELETE_CATEGORY",
      entityType: "CATEGORY",
      entityId: category.id,
      entityName: category.name,
      details: { requestId: createResult.data?.id },
    });

    revalidatePath("/admin/events");
    revalidatePath("/competitions");
    revalidatePath("/admin/approval");
    return { success: true, message: "Delete request submitted for master approval.", requestSubmitted: true };
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
  allowSubmissions?: boolean;
  virtualEnabled?: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  startTime: string;
  endTime: string;
  participantLimit: string;
  termsandconditions: string;
  virtualTermsAndConditions?: string;
  registrationLink: string;
  whatsappLink?: string;
  brochureLink?: string;
}

export async function createEvent(eventData: EventData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      return { success: false, error: "Unauthorized" };
    }

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
        allowSubmissions: !!eventData.allowSubmissions,
        virtualEnabled: !!eventData.virtualEnabled,
        minTeamSize: eventData.minTeamSize,
        maxTeamSize: eventData.maxTeamSize,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        participantLimit: parseInt(eventData.participantLimit),
        termsandconditions: eventData.termsandconditions,
        virtualTermsAndConditions: eventData.virtualTermsAndConditions || null,
        registrationLink: eventData.registrationLink,
        whatsappLink: eventData.whatsappLink || null,
        brochureLink: eventData.brochureLink || null,
        updatedAt: new Date(),
      },
    });

    await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
      action: "ADD_EVENT",
      entityType: "EVENT",
      entityId: event.id,
      entityName: event.name,
      details: { categoryId: eventData.categoryId },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath("/competitions");
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
    allowSubmissions?: boolean;
    virtualEnabled?: boolean;
    minTeamSize: number;
    maxTeamSize: number;
    startTime: string;
    endTime: string;
    participantLimit: string;
    termsandconditions: string;
    virtualTermsAndConditions?: string;
    registrationLink: string;
    whatsappLink?: string;
    brochureLink?: string;
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
        allowSubmissions: !!eventData.allowSubmissions,
        virtualEnabled: !!eventData.virtualEnabled,
        minTeamSize: eventData.minTeamSize,
        maxTeamSize: eventData.maxTeamSize,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        participantLimit: parseInt(eventData.participantLimit),
        termsandconditions: eventData.termsandconditions,
        virtualTermsAndConditions: eventData.virtualTermsAndConditions || null,
        registrationLink: eventData.registrationLink,
        whatsappLink: eventData.whatsappLink || null,
        brochureLink: eventData.brochureLink || null,
        updatedAt: new Date(),
      },
    });

    await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
      action: "EDIT_EVENT",
      entityType: "EVENT",
      entityId: event.id,
      entityName: event.name,
      details: { categoryId: eventData.categoryId },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath("/competitions");
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

    const event = await prisma.event.findUnique({
      where: { id },
      include: { Category: true },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const isMaster = session.user.role === Role.MASTER;

    if (isMaster) {
      await prisma.event.delete({ where: { id } });
      await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
        action: "DELETE_EVENT",
        entityType: "EVENT",
        entityId: event.id,
        entityName: event.name,
        details: { categoryId: event.categoryId },
      });
      revalidatePath("/admin/events");
      revalidatePath("/events");
      revalidatePath("/competitions");
      return { success: true, message: "Event deleted successfully" };
    }

    const createResult = await createDeleteRequest({
      requestedById: session.user.id,
      requestedByEmail: session.user.email ?? "",
      requestedByName: session.user.name ?? null,
      requestedByRole: session.user.role,
      entityType: "EVENT",
      entityId: event.id,
      entityName: event.name,
      categoryId: event.categoryId,
    });

    if (!createResult.success) {
      return { success: false, error: createResult.error ?? "Failed to submit delete request" };
    }

    await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
      action: "REQUEST_DELETE_EVENT",
      entityType: "EVENT",
      entityId: event.id,
      entityName: event.name,
      details: { requestId: createResult.data?.id, categoryId: event.categoryId },
    });

    revalidatePath("/admin/events");
    revalidatePath("/events");
    revalidatePath("/competitions");
    revalidatePath("/admin/approval");
    return { success: true, message: "Delete request submitted for master approval.", requestSubmitted: true };
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
  registrationDetails?: any,
  paymentDetails?: {
    paymentScreenshot: string;
    utrId: string;
    payeeName: string;
  },
  isVirtual?: boolean
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to register for events" };
    }

    const isKLStudent = session.user.email.endsWith("@kluniversity.in");
    const isInternational = !!(session.user as { isInternational?: boolean }).isInternational;

    if (!isKLStudent && !isInternational && !paymentDetails) {
      return { success: false, error: "Payment details are required for non-KL and non-international students." };
    }

    const paymentStatus = (isKLStudent || isInternational) ? "APPROVED" : "PENDING";

    const registrationResult = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: eventId },
          include: {
            _count: {
              select: {
                individualRegistrations: true,
                groupRegistrations: true,
              },
            },
          },
        });

        if (!event) {
          throw new Error("Event not found");
        }

        const currentParticipants = event._count.individualRegistrations + event._count.groupRegistrations;

        if (currentParticipants >= event.participantLimit) {
          throw new Error(EVENT_FULL_ERROR);
        }

        // Check if Leader is already registered
        const existingRegistration = await tx.groupRegistration.findUnique({
          where: {
            userId_eventId: {
              userId: session.user.id,
              eventId: eventId
            }
          }
        });
        if (existingRegistration) {
          if (existingRegistration.paymentStatus === "REJECTED") {
            await tx.groupRegistration.delete({
              where: { id: existingRegistration.id }
            });
          } else {
            throw new Error("You are already registered for this event");
          }
        }

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
            isVirtual: isVirtual || false,
            registrationDetails: registrationDetails || undefined,
            paymentScreenshot: paymentDetails?.paymentScreenshot || null,
            utrId: paymentDetails?.utrId || null,
            payeeName: paymentDetails?.payeeName || null,
            paymentStatus: paymentStatus as any
          },
        });

        // Return details needed for email
        return { success: true, teamLead: null, event, groupName, members, paymentStatus }; // teamLead null here to fetch outside tx if needed, but we used tx above.
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );


    revalidatePath("/events");
    revalidatePath("/profile");

    // International: send virtual participation confirmation email with PDF
    if (registrationResult.success && registrationResult.paymentStatus === "APPROVED" && isInternational && registrationResult.event) {
      (async () => {
        try {
          const userFull = await prisma.user.findUnique({
            where: { id: session.user!.id },
            select: { id: true, name: true, email: true, phone: true, collage: true, collageId: true, gender: true, state: true, city: true },
          });
          if (!userFull) return;
          const { generateTicketPDF } = await import("@/lib/pdf-generator");
          const ev = registrationResult.event!;
          const pdfBuffer = await generateTicketPDF({
            userId: userFull.id,
            name: userFull.name || "Team Lead",
            email: userFull.email,
            phone: userFull.phone,
            collage: userFull.collage,
            collageId: userFull.collageId,
            paymentStatus: "APPROVED",
            isApproved: true,
            eventName: ev.name,
            isGroupEvent: true,
            groupName: registrationResult.groupName || "Team",
            teamMembers: registrationResult.members || [],
            eventId: ev.id,
            gender: userFull.gender,
            state: userFull.state,
            city: userFull.city,
            isInternational: true,
          });
          const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
          await sendEventConfirmationEmail(
            { name: userFull.name || "Team Lead", email: userFull.email },
            {
              name: ev.name,
              date: ev.date,
              venue: ev.venue,
              startTime: ev.startTime ?? undefined,
              endTime: ev.endTime ?? undefined,
            },
            pdfBuffer,
            "GROUP",
            { groupName: registrationResult.groupName || "Team", members: registrationResult.members || [] },
            { description: ev.description, termsAndConditions: ev.termsandconditions, whatsappLink: ev.whatsappLink },
            true
          );
        } catch (e) {
          console.error("Failed to send international group registration email", e);
        }
      })();
    }

    // Special message for pending users
    if (registrationResult.success && registrationResult.paymentStatus === "PENDING") {
      return { success: true, message: "Registration submitted! Please wait for admin to review and approve your registration. You'll receive an email when confirmed." };
    }

    // For approved registrations (KL students), just return success
    // PDF generation and email sending will happen through admin approval action
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
            individualRegistrations: true,
            groupRegistrations: true,
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
            individualRegistrations: true,
            groupRegistrations: true,
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

export async function registerForEvent(
  eventId: string,
  registrationDetails?: any,
  paymentDetails?: {
    paymentScreenshot: string;
    utrId: string;
    payeeName: string;
  },
  isVirtual?: boolean
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to register for events" };
    }

    const isKLStudent = session.user.email.endsWith("@kluniversity.in");
    const isInternational = !!(session.user as { isInternational?: boolean }).isInternational;

    if (!isKLStudent && !isInternational && !paymentDetails) {
      return { success: false, error: "Payment details are required for non-KL and non-international students." };
    }

    const paymentStatus = (isKLStudent || isInternational) ? "APPROVED" : "PENDING";

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
                individualRegistrations: true,
                groupRegistrations: true,
              },
            },
          },
        });

        if (!event) {
          return { success: false, error: "Event not found" };
        }

        const currentParticipants = event._count.individualRegistrations + event._count.groupRegistrations;

        if (currentParticipants >= event.participantLimit) {
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
          if (existingIndividualReg.paymentStatus === "REJECTED") {
            // Delete the rejected registration so we can create a new one
            await tx.individualRegistration.delete({
              where: { id: existingIndividualReg.id }
            });
          } else {
            return { success: false, error: "You are already registered for this event" };
          }
        }

        // No longer using registeredEvents relation

        // Create Individual Registration Record
        await tx.individualRegistration.create({
          data: {
            userId: session.user.id,
            eventId: eventId,
            isVirtual: isVirtual || false,
            registrationDetails: registrationDetails || undefined,
            paymentScreenshot: paymentDetails?.paymentScreenshot || null,
            utrId: paymentDetails?.utrId || null,
            payeeName: paymentDetails?.payeeName || null,
            paymentStatus: paymentStatus as any
          }
        });

        // Re-check count after insert to ensure we didn't exceed limit
        const updated = await tx.event.findUnique({
          where: { id: eventId },
          select: {
            participantLimit: true,
            _count: {
              select: {
                individualRegistrations: true,
                groupRegistrations: true,
              },
            },
          },
        });

        if (!updated || (updated._count.individualRegistrations + updated._count.groupRegistrations) > updated.participantLimit) {
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

        return { success: true, user: session.user, event, paymentStatus };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (!registrationResult.success) {
      return registrationResult;
    }

    // Special message for pending users
    if (registrationResult.success && registrationResult.paymentStatus === "PENDING") {
      return { success: true, message: "Registration submitted! Please wait for admin to review and approve your registration. You'll receive an email when confirmed." };
    }

    // International: send virtual participation confirmation email with PDF
    if (registrationResult.success && registrationResult.paymentStatus === "APPROVED" && isInternational && registrationResult.event) {
      (async () => {
        try {
          const userFull = await prisma.user.findUnique({
            where: { id: session.user!.id },
            select: { id: true, name: true, email: true, phone: true, collage: true, collageId: true, gender: true, state: true, city: true },
          });
          if (!userFull) return;
          const { generateTicketPDF } = await import("@/lib/pdf-generator");
          const ev = registrationResult.event!;
          const pdfBuffer = await generateTicketPDF({
            userId: userFull.id,
            name: userFull.name || "Participant",
            email: userFull.email,
            phone: userFull.phone,
            collage: userFull.collage,
            collageId: userFull.collageId,
            paymentStatus: "APPROVED",
            isApproved: true,
            eventName: ev.name,
            isGroupEvent: false,
            eventId: ev.id,
            gender: userFull.gender,
            state: userFull.state,
            city: userFull.city,
            isInternational: true,
          });
          const { sendEventConfirmationEmail } = await import("@/lib/zeptomail");
          await sendEventConfirmationEmail(
            { name: userFull.name || "Participant", email: userFull.email },
            {
              name: ev.name,
              date: ev.date,
              venue: ev.venue,
              startTime: ev.startTime ?? undefined,
              endTime: ev.endTime ?? undefined,
            },
            pdfBuffer,
            "INDIVIDUAL",
            undefined,
            { description: ev.description, termsAndConditions: ev.termsandconditions, whatsappLink: ev.whatsappLink },
            true
          );
        } catch (e) {
          console.error("Failed to send international registration email", e);
        }
      })();
    }

    // For approved registrations (KL students), just return success
    // PDF generation and email sending will happen through admin approval action
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

    const individualReg = await prisma.individualRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    });

    const groupReg = await prisma.groupRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId
        }
      }
    });

    // Also check if they are a member in any group
    let isMember = false;
    let memberStatus = null;
    if (!groupReg) {
      const memberInGroup = await prisma.groupRegistration.findFirst({
        where: {
          eventId: eventId,
          members: {
            array_contains: [{ email: session.user.email }]
          }
        }
      });
      isMember = !!memberInGroup;
      memberStatus = memberInGroup?.paymentStatus;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isApproved: true }
    });

    // Determine if effectively registered (ignore REJECTED)
    const isIndivRegistered = individualReg && individualReg.paymentStatus !== "REJECTED";
    const isGroupRegistered = groupReg && groupReg.paymentStatus !== "REJECTED";
    const isMemberRegistered = isMember && memberStatus !== "REJECTED";

    // Only return registrationStatus if it's not REJECTED (allow re-registration)
    const effectiveStatus = isIndivRegistered ? individualReg.paymentStatus 
        : isGroupRegistered ? groupReg.paymentStatus 
        : isMemberRegistered ? memberStatus 
        : null;

    return {
      success: true,
      isRegistered: !!(isIndivRegistered || isGroupRegistered || isMemberRegistered),
      isApproved: !!user?.isApproved,
      registrationStatus: effectiveStatus
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

    const individualRegs = await prisma.individualRegistration.findMany({
      where: { 
        userId: session.user.id,
        paymentStatus: { not: "REJECTED" }
      },
      select: { eventId: true }
    });

    const groupRegs = await prisma.groupRegistration.findMany({
      where: { 
        userId: session.user.id,
        paymentStatus: { not: "REJECTED" }
      },
      select: { eventId: true }
    });

    const memberInGroups = await prisma.groupRegistration.findMany({
      where: {
        members: {
          array_contains: [{ email: session.user.email }]
        },
        paymentStatus: { not: "REJECTED" }
      },
      select: { eventId: true }
    });

    const registeredEventIds = Array.from(new Set([
      ...individualRegs.map(r => r.eventId),
      ...groupRegs.map(r => r.eventId),
      ...memberInGroups.map(r => r.eventId)
    ]));

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isApproved: true }
    });

    return {
      success: true,
      registeredEventIds,
      isApproved: !!user?.isApproved,
      email: session.user.email
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

    // Delete individual registration
    await prisma.individualRegistration.deleteMany({
      where: {
        userId: session.user.id,
        eventId: eventId
      }
    });

    // Delete group registration if they are the leader
    await prisma.groupRegistration.deleteMany({
      where: {
        userId: session.user.id,
        eventId: eventId
      }
    });

    // Note: If they are just a member, we might want to remove them from the members JSON,
    // but the текущий UI usually only allows unregistering for the person who registered.

    revalidatePath("/profile");
    revalidatePath("/events");
    return { success: true, message: "Successfully unregistered from event" };
  } catch (error) {
    console.error("Error unregistering from event:", error);
    return { success: false, error: "Failed to unregister from event" };
  }
}
