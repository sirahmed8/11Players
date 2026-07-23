import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only runs on Vercel (static export skips middleware entirely)
export const config = {
  matcher: [
    // Match all routes except static files and internal Next.js paths
    "/((?!_next/static|_next/image|favicon.ico|icon.jpg|sw.js|workbox|manifest).*)",
  ],
};

export async function proxy(request: NextRequest) {
  // Skip API routes from maintenance redirect
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/") || pathname.startsWith("/maintenance")) {
    return NextResponse.next();
  }

  try {
    if (!process.env.EDGE_CONFIG) return NextResponse.next();

    const { get } = await import("@vercel/edge-config");
    const maintenanceMode = await get("maintenanceMode");

    if (maintenanceMode === true) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }

    // Pass global announcement via header so layout can read it
    const [announcementEn, announcementAr] = await Promise.all([
      get("globalAnnouncementEn"),
      get("globalAnnouncementAr"),
    ]);

    const response = NextResponse.next();
    if (announcementEn) response.headers.set("x-announcement-en", String(announcementEn));
    if (announcementAr) response.headers.set("x-announcement-ar", String(announcementAr));
    return response;
  } catch (err) {
    // Never block requests due to Edge Config errors
    return NextResponse.next();
  }
}
