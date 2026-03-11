import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/lib/push";

// GET - VAPID Public Key für Client
export async function GET() {
  const publicKey = vapidPublicKey;
  
  // Debugging: Prüfe ob Key vorhanden ist
  if (!publicKey) {
    console.warn("VAPID Public Key nicht gesetzt. Prüfe NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env");
  }
  
  return NextResponse.json({ 
    publicKey: publicKey,
    // Debug-Info nur in Development
    ...(process.env.NODE_ENV === "development" && {
      debug: {
        keyLength: publicKey?.length || 0,
        keyPrefix: publicKey?.substring(0, 10) || "nicht gesetzt",
      }
    })
  });
}
