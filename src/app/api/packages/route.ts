import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: { monthlyFee: "asc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Fetch packages error:", error);
    return NextResponse.json({ error: "Hiba a csomagok lekérdezése során" }, { status: 500 });
  }
}
