import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

// GET - Alle Partys abrufen
export async function GET() {
  try {
    const parties = await db.party.findMany({
      include: {
        drinks: {
          include: {
            drink: true,
          },
        },
        orders: {
          include: {
            items: {
              include: {
                drink: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(parties);
  } catch (error) {
    console.error("Fehler beim Abrufen der Partys:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Partys" },
      { status: 500 }
    );
  }
}

// POST - Neue Party erstellen
export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const { name, drinkIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Partyname ist erforderlich" },
        { status: 400 }
      );
    }

    // Slug aus Name generieren (URL-freundlich)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Prüfen ob Slug bereits existiert
    const existing = await db.party.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Eine Party mit diesem Namen existiert bereits" },
        { status: 400 }
      );
    }

    // Party erstellen mit Getränken
    const party = await db.party.create({
      data: {
        name,
        slug,
        drinks: {
          create: (drinkIds || []).map((drinkId: string) => ({
            drinkId,
          })),
        },
      },
      include: {
        drinks: {
          include: {
            drink: true,
          },
        },
      },
    });

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Erstellen der Party:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Party" },
      { status: 500 }
    );
  }
}
