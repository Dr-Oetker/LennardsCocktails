import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

// POST - Push-Subscription speichern
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Ungültige Subscription" },
        { status: 400 }
      );
    }

    // Subscription in Datenbank speichern oder aktualisieren
    await db.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Speichern der Subscription:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern der Subscription" },
      { status: 500 }
    );
  }
}

// GET - Alle Subscriptions abrufen (für Admin)
export async function GET() {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const subscriptions = await db.pushSubscription.findMany();
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Fehler beim Abrufen der Subscriptions:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Subscriptions" },
      { status: 500 }
    );
  }
}
