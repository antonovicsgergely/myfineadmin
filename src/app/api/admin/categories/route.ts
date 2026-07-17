import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Hiba a kategóriák lekérdezésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült lekérdezni a kategóriákat." },
      { status: 500 }
    );
  }
}
