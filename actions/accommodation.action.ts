"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

interface AccommodationBookingData {
  gender: "MALE" | "FEMALE";
  bookingType: "INDIVIDUAL" | "GROUP";
  name: string;
  email: string;
  phone: string;
  numberOfGuests: number;
  groupMembers?: { name: string; phone: string; gender?: string }[];
}

/**
 * Create an accommodation booking
 */
export async function createAccommodationBooking(
  bookingData: AccommodationBookingData
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to book accommodation" };
    }

    // Validate booking data
    if (!bookingData.gender || !bookingData.bookingType) {
      return { success: false, error: "Gender and booking type are required" };
    }

    if (!bookingData.name || !bookingData.email || !bookingData.phone) {
      return {
        success: false,
        error: "Name, email, and phone number are required",
      };
    }

    // Validate number of guests for group bookings
    if (bookingData.bookingType === "GROUP") {
      if (bookingData.numberOfGuests < 2) {
        return {
          success: false,
          error: "Group bookings must have at least 2 guests",
        };
      }
      if (bookingData.numberOfGuests > 10) {
        return {
          success: false,
          error: "Group bookings cannot exceed 10 guests",
        };
      }
      // Validate group members data if provided
      if (bookingData.groupMembers && bookingData.groupMembers.length !== bookingData.numberOfGuests - 1) {
        // Note: Assuming primary user is guest #1, so we need N-1 extra details? 
        // Or does user enter details for ALL members including themselves in the group list?
        // User prompt: "take the details of other guests also according to no of guests selected."
        // Typically the primary contact is Guest 1. So we need `numberOfGuests - 1` additional entries, OR `numberOfGuests` total.
        // Let's assume the frontend will send `numberOfGuests` entries in `groupMembers` if we want full details, 
        // OR just the "other" guests. 
        // Strategy: Let's store ALL guests in `groupMembers` JSON for completeness, including the primary if feasible, 
        // OR just the additional ones. 
        // Let's adhere to "take details of *other* guests". So primary is Booking User.
        // But for a cleaner specific schema, let's allow `groupMembers` to be the list of *additional* guests.
        // Frontend will likely send `numberOfGuests - 1` members.
      }
    }

    // Check if user already has a booking
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accommodationBookings: true,
        individualRegistrations: {
          where: { paymentStatus: { not: "REJECTED" } },
          select: { id: true, isVirtual: true },
        },
        groupRegistrations: {
          where: { paymentStatus: { not: "REJECTED" } },
          select: { id: true, isVirtual: true },
        },
      },
    });

    if (!userData) {
      return { success: false, error: "User not found" };
    }

    // Restriction 1: International (virtual) participants cannot book accommodation
    const isInternational = !!(userData as { isInternational?: boolean }).isInternational;
    if (isInternational) {
      return {
        success: false,
        error: "Accommodation is only for physical participants. International (virtual) participants are not eligible.",
      };
    }

    // Restriction 3: Must have PHYSICAL (non-virtual) competition registration
    const physicalIndividualRegs = userData.individualRegistrations.filter(
      (r: { isVirtual?: boolean }) => !r.isVirtual
    );
    const physicalGroupRegs = userData.groupRegistrations.filter(
      (r: { isVirtual?: boolean }) => !r.isVirtual
    );
    const hasPhysicalCompetitionReg =
      physicalIndividualRegs.length > 0 || physicalGroupRegs.length > 0;

    if (!hasPhysicalCompetitionReg) {
      const hasAnyCompetitionReg =
        userData.individualRegistrations.length > 0 || userData.groupRegistrations.length > 0;
      return {
        success: false,
        error: hasAnyCompetitionReg
          ? "Accommodation is only for physical participants. Virtual participants are not eligible."
          : "You must be registered for at least one competition (physical participation) to book accommodation.",
      };
    }

    // Check for existing booking of same gender (user can have one MALE + one FEMALE)
    const existingBookingOfGender = userData.accommodationBookings.find(
      (b: { gender: string; status: string }) =>
        b.gender === bookingData.gender && b.status !== "REJECTED" && b.status !== "CANCELLED"
    );
    if (existingBookingOfGender) {
      return {
        success: false,
        error: `You already have an active ${bookingData.gender.toLowerCase()} accommodation booking.`,
      };
    }

    // Calculate total members
    const totalMembers = bookingData.numberOfGuests;

    // Free accommodation
    const amount = 0;

    // Create booking in database
    const booking = await prisma.accommodationBooking.create({
      data: {
        userId: session.user.id,
        gender: bookingData.gender,
        bookingType: bookingData.bookingType,
        primaryName: bookingData.name,
        primaryEmail: bookingData.email,
        primaryPhone: bookingData.phone,
        totalMembers: totalMembers,
        groupMembers: bookingData.groupMembers as any, // Prisma Json handling
        amount: amount,
        paymentStatus: "PENDING", // Pending approval
        status: "PENDING", // Pending admin approval
      },
    });

    // Revalidate paths
    revalidatePath("/accommodation");
    revalidatePath("/profile");

    return {
      success: true,
      message: "Accommodation request submitted! pending approval.",
      data: {
        bookingId: booking.id,
        totalMembers,
        amount: amount,
      },
    };
  } catch (error) {
    console.error("Error creating accommodation booking:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

/**
 * Get physical competition registration data for accommodation auto-fill
 */
export async function getCompetitionDataForAccommodation() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || !session.user) {
      return { success: false, error: "Please login" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        gender: true,
        isInternational: true,
        collage: true,
      },
    });

    if (!user) return { success: false, error: "User not found" };

    // Block international (virtual)
    if (user.isInternational) {
      return { success: false, error: "Accommodation is only for physical participants." };
    }

    const [individualRegs, groupRegs] = await Promise.all([
      prisma.individualRegistration.findMany({
        where: {
          userId: session.user.id,
          paymentStatus: { not: "REJECTED" },
          isVirtual: false,
        },
        select: { id: true },
      }),
      prisma.groupRegistration.findMany({
        where: {
          userId: session.user.id,
          paymentStatus: { not: "REJECTED" },
          isVirtual: false,
        },
        select: { members: true },
      }),
    ]);

    const hasIndividualPhysical = individualRegs.length > 0;
    const hasGroupPhysical = groupRegs.length > 0;

    if (!hasIndividualPhysical && !hasGroupPhysical) {
      return { success: false, error: "No physical competition registrations found." };
    }

    const teamLead = {
      name: user.name || session.user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender?.toUpperCase() === "FEMALE" ? "FEMALE" as const : "MALE" as const,
    };

    if (hasGroupPhysical && !hasIndividualPhysical) {
      // Use group data - collect all members from all group regs
      const allMembers: { name: string; phone: string; gender?: string }[] = [];
      for (const gr of groupRegs) {
        const members = (gr.members as any) || [];
        for (const m of members) {
          if (m && typeof m === "object") {
            const g = (m.gender || "").toString().toUpperCase();
            allMembers.push({
              name: m.name || "",
              phone: m.phone || "",
              gender: g === "FEMALE" || g === "MALE" ? g : undefined,
            });
          }
        }
      }

      const maleMembers = allMembers.filter(m => (m.gender || "").toUpperCase() === "MALE");
      const femaleMembers = allMembers.filter(m => (m.gender || "").toUpperCase() === "FEMALE");
      const maleCount = (teamLead.gender === "MALE" ? 1 : 0) + maleMembers.length;
      const femaleCount = (teamLead.gender === "FEMALE" ? 1 : 0) + femaleMembers.length;

      const suggestedRegistrations: Array<{
        gender: "MALE" | "FEMALE";
        bookingType: "INDIVIDUAL" | "GROUP";
        primaryName: string;
        primaryEmail: string;
        primaryPhone: string;
        numberOfGuests: number;
        groupMembers: { name: string; phone: string; gender?: string }[];
      }> = [];

      if (maleCount > 0) {
        const maleGroupMembers = maleMembers.map(m => ({ name: m.name, phone: m.phone }));
        if (teamLead.gender === "MALE") {
          suggestedRegistrations.push({
            gender: "MALE",
            bookingType: maleCount === 1 ? "INDIVIDUAL" : "GROUP",
            primaryName: teamLead.name,
            primaryEmail: teamLead.email,
            primaryPhone: teamLead.phone,
            numberOfGuests: maleCount,
            groupMembers: maleCount === 1 ? [] : maleGroupMembers,
          });
        } else {
          const firstMale = maleMembers[0];
          suggestedRegistrations.push({
            gender: "MALE",
            bookingType: maleCount === 1 ? "INDIVIDUAL" : "GROUP",
            primaryName: firstMale?.name || "",
            primaryEmail: "",
            primaryPhone: firstMale?.phone || "",
            numberOfGuests: maleCount,
            groupMembers: maleCount === 1 ? [] : maleGroupMembers.slice(1),
          });
        }
      }
      if (femaleCount > 0) {
        const femaleGroupMembers = femaleMembers.map(m => ({ name: m.name, phone: m.phone }));
        if (teamLead.gender === "FEMALE") {
          suggestedRegistrations.push({
            gender: "FEMALE",
            bookingType: femaleCount === 1 ? "INDIVIDUAL" : "GROUP",
            primaryName: teamLead.name,
            primaryEmail: teamLead.email,
            primaryPhone: teamLead.phone,
            numberOfGuests: femaleCount,
            groupMembers: femaleCount === 1 ? [] : femaleGroupMembers,
          });
        } else {
          const firstFemale = femaleMembers[0];
          suggestedRegistrations.push({
            gender: "FEMALE",
            bookingType: femaleCount === 1 ? "INDIVIDUAL" : "GROUP",
            primaryName: firstFemale?.name || "",
            primaryEmail: "",
            primaryPhone: firstFemale?.phone || "",
            numberOfGuests: femaleCount,
            groupMembers: femaleCount === 1 ? [] : femaleGroupMembers.slice(1),
          });
        }
      }

      if (suggestedRegistrations.length === 0) {
        suggestedRegistrations.push({
          gender: teamLead.gender,
          bookingType: allMembers.length === 0 ? "INDIVIDUAL" : "GROUP",
          primaryName: teamLead.name,
          primaryEmail: teamLead.email,
          primaryPhone: teamLead.phone,
          numberOfGuests: allMembers.length + 1,
          groupMembers: allMembers.map(m => ({ name: m.name, phone: m.phone })),
        });
      }

      return {
        success: true,
        data: {
          hasIndividualPhysical: false,
          hasGroupPhysical: true,
          teamLead,
          suggestedRegistrations,
        },
      };
    }

    // Individual only
    return {
      success: true,
      data: {
        hasIndividualPhysical: true,
        hasGroupPhysical: false,
        teamLead,
        suggestedRegistrations: [{
          gender: teamLead.gender,
          bookingType: "INDIVIDUAL" as const,
          primaryName: teamLead.name,
          primaryEmail: teamLead.email,
          primaryPhone: teamLead.phone,
          numberOfGuests: 1,
          groupMembers: [],
        }],
      },
    };
  } catch (error) {
    console.error("Error fetching competition data for accommodation:", error);
    return { success: false, error: "Failed to fetch data" };
  }
}

/**
 * Get user's accommodation bookings
 */
export async function getUserAccommodationBookings() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to view bookings" };
    }

    // Fetch user's bookings
    const bookings = await prisma.accommodationBooking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal types for client component
    const serializedBookings = bookings.map(booking => ({
      ...booking,
      amount: booking.amount ? Number(booking.amount) : 0,
    }));

    return {
      success: true,
      data: serializedBookings,
    };
  } catch (error) {
    console.error("Error fetching accommodation bookings:", error);
    return { success: false, error: "Failed to fetch bookings" };
  }
}

/**
 * Cancel an accommodation booking
 */
export async function cancelAccommodationBooking(bookingId: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session || !session.user) {
      return { success: false, error: "Please login to cancel booking" };
    }

    // Find the booking
    const booking = await prisma.accommodationBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // Verify ownership
    if (booking.userId !== session.user.id) {
      return { success: false, error: "Unauthorized to cancel this booking" };
    }

    // Check if already cancelled
    if (booking.status === "CANCELLED") {
      return { success: false, error: "Booking is already cancelled" };
    }

    // Update booking status
    await prisma.accommodationBooking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // Revalidate paths
    revalidatePath("/accommodation");
    revalidatePath("/profile");

    return {
      success: true,
      message: "Booking cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling accommodation booking:", error);
    return { success: false, error: "Failed to cancel booking" };
  }
}
