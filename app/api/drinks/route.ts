import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Alle Getränke abrufen
export async function GET() {
  try {
    const drinks = await db.drink.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(drinks);
  } catch (error) {
    console.error("Fehler beim Abrufen der Getränke:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Getränke" },
      { status: 500 }
    );
  }
}

// POST - Neues Getränk erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ingredients, recipe } = body;

    if (!name || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Name und Zutaten (Array) sind erforderlich" },
        { status: 400 }
      );
    }

    const drink = await db.drink.create({
      data: {
        name,
        ingredients,
        recipe: recipe || null,
      },
    });

    return NextResponse.json(drink, { status: 201 });
  } catch (error: any) {
    console.error("Fehler beim Erstellen des Getränks:", error);
    
    // Detaillierte Fehlermeldung für Debugging
    const errorMessage = error?.message || "Fehler beim Erstellen des Getränks";
    
    return NextResponse.json(
      { 
        error: "Fehler beim Erstellen des Getränks",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
