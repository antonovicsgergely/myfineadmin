import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const archivedDiscount = await prisma.vendorDiscount.update({
      where: { id },
      data: {
        isArchived: true,
      },
      include: { vendor: true },
    });

    return NextResponse.json(archivedDiscount);
  } catch (error) {
    console.error("Hiba a kedvezmény archiválásakor:", error);
    return NextResponse.json(
      { error: "Nem sikerült archiválni a kedvezményt." },
      { status: 500 }
    );
  }
}
