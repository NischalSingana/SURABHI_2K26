import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAppVersion } from "@/lib/app-version";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const appVersion = getAppVersion();

  if (host.startsWith("www.")) {
    const newUrl = new URL(request.url);
    newUrl.host = host.replace("www.", "");
    const redirectResponse = NextResponse.redirect(newUrl, 301);
    redirectResponse.headers.set("x-app-version", appVersion);
    return redirectResponse;
  }

  const response = NextResponse.next();
  response.headers.set("x-app-version", appVersion);

  // Avoid stale HTML documents being cached by proxies/CDNs across deployments.
  const accept = request.headers.get("accept") || "";
  if (request.method === "GET" && accept.includes("text/html")) {
    response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|api/health).*)",
  ],
};
