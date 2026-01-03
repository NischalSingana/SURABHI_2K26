import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url = request.nextUrl.searchParams.get("url");

        if (!url) {
            return NextResponse.json(
                { error: "URL parameter is required" },
                { status: 400 }
            );
        }

        // Validate that the URL belongs to our domain or R2 (security check)
        // For now, allowing any valid URL, but in production should verify host
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: "Invalid URL provided" },
                { status: 400 }
            );
        }

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch file" },
                { status: response.status }
            );
        }

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        const contentDisposition = `attachment; filename="schedule-image.${contentType.split('/')[1] || 'jpg'}"`;

        return new NextResponse(response.body, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": contentDisposition,
            },
        });
    } catch (error) {
        console.error("Error proxying download:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
