import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only works on Vercel (API routes don't exist in static export)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    const uid = searchParams.get("uid");

    if (!filename || !uid) {
      return NextResponse.json({ error: "Missing filename or uid" }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: "No file body" }, { status: 400 });
    }

    // Validate file type
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
      return NextResponse.json({ error: "Only JPG, PNG, and WEBP allowed" }, { status: 400 });
    }

    const blob = await put(`avatars/${uid}/${filename}`, request.body, {
      access: "public",
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error("[Blob] Upload failed:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
