import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { commissionRate } = await req.json();

    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: {
        commissionRate: commissionRate !== null ? parseFloat(commissionRate) : null,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Hiba a kategória frissítésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült frissíteni a kategóriát." },
      { status: 500 }
    );
  }
}
