import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT - Bestellung als erledigt markieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isCompleted } = body;

    const order = await db.order.update({
      where: { id },
      data: {
        isCompleted: isCompleted ?? false,
        completedAt: isCompleted ? new Date() : null,
      },
      include: {
        items: {
          include: {
            drink: true,
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Fehler beim Aktualisieren der Bestellung:", error);
    
    // Detaillierte Fehlermeldung für Debugging
    const errorMessage = error?.message || "Fehler beim Aktualisieren der Bestellung";
    
    return NextResponse.json(
      { 
        error: "Fehler beim Aktualisieren der Bestellung",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
