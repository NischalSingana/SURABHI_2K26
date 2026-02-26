"use server";

import { NextResponse } from "next/server";
import { registerForEvent, registerGroupEvent } from "@/actions/events.action";

type GroupMember = {
  name: string;
  phone?: string;
  gender: string;
  inGameName?: string;
  inGameId?: string;
  riotId?: string;
};

type PaymentDetails = {
  paymentScreenshot: string;
  utrId: string;
  payeeName: string;
};

type RegisterRequestBody = {
  eventId: string;
  isGroupEvent?: boolean;
  groupName?: string;
  members?: GroupMember[];
  mentorName?: string;
  mentorPhone?: string;
  registrationDetails?: Record<string, unknown>;
  paymentDetails?: PaymentDetails;
  isVirtual?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequestBody;

    if (!body?.eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    if (body.isGroupEvent) {
      const result = await registerGroupEvent(
        body.eventId,
        body.groupName || "Team",
        body.members || [],
        body.mentorName,
        body.mentorPhone,
        body.registrationDetails,
        body.paymentDetails,
        !!body.isVirtual
      );
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    const result = await registerForEvent(
      body.eventId,
      body.registrationDetails,
      body.paymentDetails,
      !!body.isVirtual
    );
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("Competition registration API fallback failed:", error);
    return NextResponse.json({ success: false, error: "Failed to submit registration" }, { status: 500 });
  }
}
