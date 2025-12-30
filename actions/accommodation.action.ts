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
    }

    // Check if user already has a booking
    const existingBooking = await prisma.accommodationBooking.findUnique({
      where: { userId: session.user.id },
    });

    if (existingBooking) {
      return {
        success: false,
        error: "You already have an accommodation booking. Please cancel it first to create a new one.",
      };
    }

    // Calculate total members
    const totalMembers = bookingData.numberOfGuests;

    // Calculate amount (₹500 per person - can be adjusted)
    const pricePerPerson = 500;
    const amount = totalMembers * pricePerPerson;

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
        groupMembers: undefined, // No longer storing individual member details
        amount: amount,
        paymentStatus: "PENDING",
        status: "PENDING",
      },
    });

    // Revalidate paths
    revalidatePath("/accommodation");
    revalidatePath("/profile");

    return {
      success: true,
      message: "Accommodation booking created successfully! Payment gateway will be integrated soon.",
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

    return {
      success: true,
      data: bookings,
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
