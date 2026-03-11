import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    const adminPassword = process.env.ADMIN_PASSWORD || "changeme";

    if (password === adminPassword) {
      // Einfache Session mit Cookie (für Demo-Zwecke)
      // In Production sollte man JWT oder eine echte Session verwenden
      const cookieStore = await cookies();
      cookieStore.set("admin-authenticated", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 Tage
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Falsches Passwort" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login-Fehler:", error);
    return NextResponse.json(
      { error: "Fehler beim Login" },
      { status: 500 }
    );
  }
}
