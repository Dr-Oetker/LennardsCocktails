import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Einzelnes Getränk abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const drink = await db.drink.findUnique({
      where: { id },
    });

    if (!drink) {
      return NextResponse.json(
        { error: "Getränk nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json(drink);
  } catch (error) {
    console.error("Fehler beim Abrufen des Getränks:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen des Getränks" },
      { status: 500 }
    );
  }
}

// PUT - Getränk aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, ingredients, recipe } = body;

    if (!name || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Name und Zutaten (Array) sind erforderlich" },
        { status: 400 }
      );
    }

    const drink = await db.drink.update({
      where: { id },
      data: {
        name,
        ingredients,
        recipe: recipe || null,
      },
    });

    return NextResponse.json(drink);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Getränks:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Getränks" },
      { status: 500 }
    );
  }
}

// DELETE - Getränk löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.drink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Löschen des Getränks:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Getränks" },
      { status: 500 }
    );
  }
}
