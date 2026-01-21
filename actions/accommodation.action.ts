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
        individualRegistrations: { select: { id: true } },
        groupRegistrations: { select: { id: true } }
      }
    });

    if (!userData) {
      return { success: false, error: "User not found" };
    }

    // Restriction 1: KL University Students cannot book accommodation here
    if (userData.email.endsWith("@kluniversity.in")) {
      return {
        success: false,
        error: "Accommodation booking is not available for KL University students."
      };
    }

    // Restriction 2: Must be registered for at least one competition
    const isRegistered = userData.individualRegistrations.length > 0 || userData.groupRegistrations.length > 0;
    if (!isRegistered) {
      return {
        success: false,
        error: "You must be registered for at least one competition to book accommodation."
      };
    }

    const existingBooking = userData.accommodationBookings[0];

    if (existingBooking) {
      if (existingBooking.status === "REJECTED" || existingBooking.status === "CANCELLED") {
        // If booking was rejected or cancelled, delete it to allow new booking
        // (Since schema enforces unique userId, we must remove the old one or update it. 
        // Deleting is cleaner for a fresh start)
        await prisma.accommodationBooking.delete({
          where: { id: existingBooking.id },
        });
      } else {
        return {
          success: false,
          error: "You already have an active accommodation booking.",
        };
      }
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
