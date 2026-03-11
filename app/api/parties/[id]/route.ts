import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

// GET - Einzelne Party abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const party = await db.party.findUnique({
      where: { id },
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
          orderBy: [
            { isCompleted: "asc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!party) {
      return NextResponse.json(
        { error: "Party nicht gefunden" },
        { status: 404 }
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

// PUT - Party aktualisieren (z.B. isActive, Getränke hinzufügen/entfernen)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json();
    const { isActive, drinkIds } = body;

    // Wenn drinkIds übergeben wird, ersetze alle Getränke
    if (drinkIds !== undefined) {
      // Alte Getränke löschen
      await db.partyDrink.deleteMany({
        where: { partyId: id },
      });

      // Neue Getränke hinzufügen
      if (drinkIds.length > 0) {
        await db.partyDrink.createMany({
          data: drinkIds.map((drinkId: string) => ({
            partyId: id,
            drinkId,
          })),
        });
      }
    }

    // Party aktualisieren
    const updateData: { isActive?: boolean } = {};
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const party = await db.party.update({
      where: { id },
      data: updateData,
      include: {
        drinks: {
          include: {
            drink: true,
          },
        },
      },
    });

    return NextResponse.json(party);
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Party:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Party" },
      { status: 500 }
    );
  }
}

// DELETE - Party löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    await db.party.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Löschen der Party:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Party" },
      { status: 500 }
    );
  }
}
