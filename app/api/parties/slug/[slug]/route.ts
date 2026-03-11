import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Party anhand des Slugs abrufen (öffentlich)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const party = await db.party.findUnique({
      where: { slug },
      include: {
        drinks: {
          include: {
            drink: {
              select: {
                id: true,
                name: true,
                ingredients: true,
                // Rezept wird NICHT zurückgegeben (nur für Admin)
              },
            },
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

    // Nur aktive Partys zurückgeben
    if (!party.isActive) {
      return NextResponse.json(
        { error: "Diese Party ist nicht mehr aktiv" },
        { status: 400 }
      );
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error("Fehler beim Abrufen der Party:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Party" },
      { status: 500 }
    );
  }
}
