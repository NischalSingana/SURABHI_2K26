import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize DigitalOcean Spaces client (S3-compatible)
const doSpacesClient = new S3Client({
    region: process.env.DO_SPACES_REGION || "sgp1",
    endpoint: process.env.DO_SPACES_ENDPOINT || "https://sgp1.digitaloceanspaces.com",
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY || "",
        secretAccessKey: process.env.DO_SPACES_SECRET || "",
    },
    forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
});

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Upload a file to DigitalOcean Spaces
 * @param file - The file buffer to upload
 * @param filename - The name to save the file as
 * @param contentType - The MIME type of the file
 * @returns Upload result with public URL or error
 */
export async function uploadToDOSpaces(
    file: Buffer,
    filename: string,
    contentType: string
): Promise<UploadResult> {
    try {
        // Validate environment variables
        if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET || !process.env.DO_SPACES_BUCKET) {
            return {
                success: false,
                error: "DO Spaces credentials not configured. Please check your environment variables.",
            };
        }

        // Upload to DO Spaces
        const command = new PutObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filename,
            Body: file,
            ContentType: contentType,
            ACL: "public-read", // Make the file publicly accessible
        });

        await doSpacesClient.send(command);

        // Generate public URL
        const publicUrl = getDOSpacesUrl(filename);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        console.error("Error uploading to DO Spaces:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload to DO Spaces",
        };
    }
}

/**
 * Generate a public URL for a DO Spaces object
 * @param filename - The filename/key in the DO Spaces bucket
 * @returns The public URL
 */
export function getDOSpacesUrl(filename: string): string {
    const bucket = process.env.DO_SPACES_BUCKET || "";
    const region = process.env.DO_SPACES_REGION || "sgp1";
    
    // Use CDN URL if available, otherwise use direct Spaces URL
    const cdnUrl = process.env.NEXT_PUBLIC_GALLERY_CDN_URL;
    if (cdnUrl) {
        const baseUrl = cdnUrl.endsWith("/") ? cdnUrl.slice(0, -1) : cdnUrl;
        const key = filename.startsWith("/") ? filename.slice(1) : filename;
        return `${baseUrl}/${key}`;
    }

    // Fallback to direct Spaces URL
    const key = filename.startsWith("/") ? filename.slice(1) : filename;
    return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
}

/**
 * Check if a file exists in DO Spaces
 * @param filename - The filename/key to check
 * @returns true if file exists, false otherwise
 */
export async function fileExistsInDOSpaces(filename: string): Promise<boolean> {
    try {
        if (!process.env.DO_SPACES_BUCKET) {
            return false;
        }

        const command = new HeadObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filename,
        });

        await doSpacesClient.send(command);
        return true;
    } catch (error: any) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        console.error("Error checking file existence in DO Spaces:", error);
        return false;
    }
}

/**
 * Generate a signed URL for downloading a file
 * @param filename - The filename/key in the DO Spaces bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns The signed download URL
 */
export async function getDOSpacesDownloadUrl(
    filename: string,
    expiresIn: number = 3600
): Promise<string> {
    try {
        if (!process.env.DO_SPACES_BUCKET) {
            throw new Error("DO_SPACES_BUCKET not configured");
        }

        const command = new GetObjectCommand({
            Bucket: process.env.DO_SPACES_BUCKET,
            Key: filename,
            ResponseContentDisposition: `attachment; filename="${filename}"`,
        });

        // Generate signed URL
        const url = await getSignedUrl(doSpacesClient, command, { expiresIn });
        return url;
    } catch (error) {
        console.error("Error generating signed download URL:", error);
        throw new Error("Failed to generate download URL");
    }
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
 * Validate file type for payment screenshots – allow all image formats
 * @param contentType - The MIME type to validate
 * @returns true if any image/* type
 */
export function isValidPaymentImageType(contentType: string): boolean {
    return typeof contentType === "string" && contentType.startsWith("image/");
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
