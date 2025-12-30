import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Upload a file to the public/uploads directory
 * @param file - The file to upload
 * @param folder - Optional subfolder within uploads
 * @returns The public URL path to the uploaded file
 */
export async function uploadFile(
  file: File,
  folder: string = "payment-proofs"
): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, "-");
    const filename = `${timestamp}-${originalName}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    // Write file to disk
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return public URL path
    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error("File upload error:", error);
    throw new Error("Failed to upload file");
  }
}
