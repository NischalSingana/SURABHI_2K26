import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize R2 client
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Upload a file to Cloudflare R2
 * @param file - The file buffer to upload
 * @param filename - The name to save the file as
 * @param contentType - The MIME type of the file
 * @returns Upload result with public URL or error
 */
export async function uploadToR2(
    file: Buffer,
    filename: string,
    contentType: string
): Promise<UploadResult> {
    try {
        // Validate environment variables
        if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
            return {
                success: false,
                error: "R2 credentials not configured. Please check your environment variables.",
            };
        }

        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filename,
            Body: file,
            ContentType: contentType,
        });

        await r2Client.send(command);

        // Generate public URL
        const publicUrl = getR2Url(filename);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        console.error("Error uploading to R2:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload to R2",
        };
    }
}

/**
 * Generate a public URL for an R2 object
 * @param filename - The filename/key in the R2 bucket
 * @returns The public URL
 */
export function getR2Url(filename: string): string {
    const publicUrl = process.env.R2_PUBLIC_URL || "";

    if (!publicUrl) {
        throw new Error("R2_PUBLIC_URL not configured");
    }

    // Ensure the URL doesn't end with a slash and filename doesn't start with one
    const baseUrl = publicUrl.endsWith("/") ? publicUrl.slice(0, -1) : publicUrl;
    const key = filename.startsWith("/") ? filename.slice(1) : filename;

    return `${baseUrl}/${key}`;
}

/**
 * Validate file type for image uploads
 * @param contentType - The MIME type to validate
 * @returns true if valid image type
 */
export function isValidImageType(contentType: string): boolean {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
    ];
    return allowedTypes.includes(contentType);
}

/**
 * Generate a unique filename with timestamp
 * @param originalName - The original filename
 * @returns A unique filename
 */
export function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const sanitized = originalName.replace(/\s+/g, "-").toLowerCase();
    return `${timestamp}-${sanitized}`;
}

/**
 * Generate a signed URL for downloading a file with Content-Disposition attachment
 * @param filename - The filename/key in the R2 bucket
 * @returns The signed download URL
 */
export async function getDownloadUrl(filename: string): Promise<string> {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: filename,
            ResponseContentDisposition: `attachment; filename="${filename}"`,
        });

        // Generate signed URL that expires in 1 hour
        const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error("Error generating signed download URL:", error);
        throw new Error("Failed to generate download URL");
    }
}
