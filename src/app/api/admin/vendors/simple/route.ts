import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      select: {
        id: true,
        companyName: true,
        brandName: true,
      },
      orderBy: {
        companyName: "asc",
      },
    });
    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Hiba a gyártók lekérdezésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült lekérdezni a gyártókat." },
      { status: 500 }
    );
  }
}
