import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";

// POST - Neue Bestellung aufgeben
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partyId, guestName, drinkIds } = body;

    if (!partyId || !guestName || !drinkIds || !Array.isArray(drinkIds) || drinkIds.length === 0) {
      return NextResponse.json(
        { error: "Party-ID, Gastname und mindestens ein Getränk sind erforderlich" },
        { status: 400 }
      );
    }

    // Prüfen ob Party existiert und aktiv ist
    const party = await db.party.findUnique({
      where: { id: partyId },
      include: {
        drinks: {
          include: {
            drink: true,
          },
        },
      },
    });

    if (!party) {
      return NextResponse.json(
        { error: "Party nicht gefunden" },
        { status: 404 }
      );
    }

    if (!party.isActive) {
      return NextResponse.json(
        { error: "Diese Party ist nicht mehr aktiv" },
        { status: 400 }
      );
    }

    // Prüfen ob alle Getränke verfügbar sind
    const availableDrinkIds = party.drinks.map((pd) => pd.drink.id);
    const invalidDrinks = drinkIds.filter((id: string) => !availableDrinkIds.includes(id));

    if (invalidDrinks.length > 0) {
      return NextResponse.json(
        { error: "Ein oder mehrere Getränke sind nicht verfügbar" },
        { status: 400 }
      );
    }

    // Bestellung erstellen
    const order = await db.order.create({
      data: {
        guestName: guestName.trim(),
        partyId,
        items: {
          create: drinkIds.map((drinkId: string) => ({
            drinkId,
          })),
        },
      },
      include: {
        items: {
          include: {
            drink: true,
          },
        },
        party: {
          select: {
            name: true,
          },
        },
      },
    });

    // Push-Benachrichtigungen an alle registrierten Subscriptions senden
    try {
      const subscriptions = await db.pushSubscription.findMany();
      const drinkNames = order.items.map((item) => item.drink.name).join(", ");

      // Push-Benachrichtigungen asynchron senden (nicht auf Antwort warten)
      Promise.all(
        subscriptions.map((sub) =>
          sendPushNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            {
              title: `Neue Bestellung von ${order.guestName}`,
              body: `${drinkNames} bei ${order.party.name}`,
              data: {
                orderId: order.id,
                partyId: partyId,
              },
            }
          ).catch((error) => {
            // Wenn Subscription ungültig ist, entferne sie
            if (error.message === "SUBSCRIPTION_EXPIRED") {
              db.pushSubscription.delete({ where: { id: sub.id } }).catch(console.error);
            }
          })
        )
      ).catch(console.error);
    } catch (pushError) {
      // Push-Fehler sollten die Bestellung nicht verhindern
      console.error("Fehler beim Senden von Push-Benachrichtigungen:", pushError);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Erstellen der Bestellung:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Bestellung" },
      { status: 500 }
    );
  }
}
