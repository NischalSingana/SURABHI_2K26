"use server";

import { uploadToR2, isValidImageType, generateUniqueFilename } from "@/lib/r2";

export async function uploadEventImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
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

    // Generate unique filename
    const filename = `events/${generateUniqueFilename(file.name)}`;

    // Upload to R2
    const result = await uploadToR2(buffer, filename, file.type);

    return result;
  } catch (error) {
    console.error("Error uploading event image:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function uploadCategoryImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return { success: false, error: "Invalid file type. Only images are allowed." };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: "File size too large. Maximum size is 10MB." };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = `categories/${generateUniqueFilename(file.name)}`;

    // Upload to R2
    const result = await uploadToR2(buffer, filename, file.type);

    return result;
  } catch (error) {
    console.error("Error uploading category image:", error);
    return { success: false, error: "Failed to upload file" };
  }
}

export async function uploadGalleryImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return { success: false, error: "Invalid file type. Only images are allowed." };
    }

    // Validate file size (10MB max for gallery)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, error: "File size too large. Maximum size is 10MB." };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = `gallery/${generateUniqueFilename(file.name)}`;

    // Upload to R2
    const result = await uploadToR2(buffer, filename, file.type);

    return result;
  } catch (error) {
    console.error("Error uploading gallery image:", error);
    return { success: false, error: "Failed to upload file" };
  }
}
