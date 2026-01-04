import { uploadToR2 } from "./r2";

/**
 * Upload a file to Cloudflare R2
 * @param file - The file to upload
 * @param folder - Optional subfolder/prefix (used as part of the filename key)
 * @returns The public URL to the uploaded file
 */
export async function uploadFile(
  file: File,
  folder: string = "payment-proofs"
): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with timestamp and folder prefix
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, "-");
    // e.g. "payment-proofs/170982738-screenshot.png"
    const filename = `${folder}/${timestamp}-${originalName}`;

    const result = await uploadToR2(buffer, filename, file.type);

    if (!result.success || !result.url) {
      throw new Error(result.error || "R2 Upload failed without error message");
    }

    return result.url;
  } catch (error) {
    console.error("File upload error:", error);
    throw new Error("Failed to upload file");
  }
}
