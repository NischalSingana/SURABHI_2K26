"use server";

import { uploadToR2, isValidImageType, generateUniqueFilename, compressImage } from "@/lib/r2";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { logAdminActivity } from "@/lib/admin-logs";

export async function uploadEventImage(formData: FormData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (!isValidImageType(file.type)) {
      return { success: false, error: "Invalid file type. Only images are allowed." };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File size too large. Maximum size is 10MB." };
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    const { buffer, contentType, extension } = await compressImage(rawBuffer, file.type);

    const baseName = file.name.replace(/\.[^.]+$/, "") + extension;
    const filename = `events/${generateUniqueFilename(baseName)}`;

    const result = await uploadToR2(buffer, filename, contentType);

    if (result.success) {
      await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
        action: "UPLOAD_EVENT_IMAGE",
        entityType: "EVENT_IMAGE",
        entityName: file.name,
        details: { url: result.url, originalSize: file.size, compressedSize: buffer.length },
      });
    }

    return result;
  } catch (error) {
    console.error("Error uploading event image:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function uploadCategoryImage(formData: FormData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (!isValidImageType(file.type)) {
      return { success: false, error: "Invalid file type. Only images are allowed." };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File size too large. Maximum size is 10MB." };
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    const { buffer, contentType, extension } = await compressImage(rawBuffer, file.type);

    const baseName = file.name.replace(/\.[^.]+$/, "") + extension;
    const filename = `categories/${generateUniqueFilename(baseName)}`;

    const result = await uploadToR2(buffer, filename, contentType);

    if (result.success) {
      await logAdminActivity(session.user as { id: string; email?: string | null; name?: string | null; role: string }, {
        action: "UPLOAD_CATEGORY_IMAGE",
        entityType: "CATEGORY_IMAGE",
        entityName: file.name,
        details: { url: result.url, originalSize: file.size, compressedSize: buffer.length },
      });
    }

    return result;
  } catch (error) {
    console.error("Error uploading category image:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function uploadGalleryImage(formData: FormData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MASTER && session.user.role !== Role.MANAGER)) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (!isValidImageType(file.type)) {
      return { success: false, error: "Invalid file type. Only images are allowed." };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File size too large. Maximum size is 10MB." };
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    const { buffer, contentType, extension } = await compressImage(rawBuffer, file.type);

    const baseName = file.name.replace(/\.[^.]+$/, "") + extension;
    const filename = `gallery/${generateUniqueFilename(baseName)}`;

    const result = await uploadToR2(buffer, filename, contentType);

    return result;
  } catch (error) {
    console.error("Error uploading gallery image:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function uploadPaymentScreenshot(formData: FormData) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    // Allow any authenticated user to upload payment screenshot
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const { uploadToR2, generateUniqueFilename } = await import("@/lib/r2");

    // Validate file type – allow all image formats
    if (typeof file.type !== "string" || !file.type.startsWith("image/")) {
      return { success: false, error: "Invalid file type. Only images are allowed." };
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: "File size too large. Maximum size is 5MB." };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to R2 – payments-screenshots folder (visitor pass + competition payments)
    const filename = `payments-screenshots/${generateUniqueFilename(file.name)}`;
    const result = await uploadToR2(buffer, filename, file.type);

    return result;
  } catch (error) {
    console.error("Error uploading payment screenshot:", error);
    return { success: false, error: "Failed to upload file" };
  }
}
