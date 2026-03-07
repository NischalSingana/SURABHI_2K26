"use server";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadToR2, generateUniqueFilename } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (typeof file.type !== "string" || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size too large. Maximum size is 5MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `payments-screenshots/${generateUniqueFilename(file.name)}`;
    const result = await uploadToR2(buffer, filename, file.type);

    if (!result.success || !result.url) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to upload payment screenshot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: result.url }, { status: 200 });
  } catch (error) {
    console.error("Error in payment screenshot API upload:", error);
    return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 });
  }
}
