import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const packages = await prisma.subscriptionPackage.findMany({
      orderBy: { monthlyFee: "asc" },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Fetch packages error:", error);
    return NextResponse.json({ error: "Hiba a lekérdezés során" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();
    const { 
      id, name, commissionRate, promoCommissionRate, monthlyFee, isActive,
      marketingFee, cardFee, activeProductLimit
    } = data;

    if (!id || typeof commissionRate !== "number" || typeof monthlyFee !== "number") {
      return NextResponse.json({ error: "Hiányzó vagy érvénytelen paraméterek" }, { status: 400 });
    }

    const updatedPackage = await prisma.subscriptionPackage.update({
      where: { id },
      data: {
        name,
        commissionRate,
        promoCommissionRate,
        monthlyFee,
        isActive,
        marketingFee,
        cardFee,
        activeProductLimit
      },
    });

    return NextResponse.json({ message: "Csomag sikeresen frissítve!", package: updatedPackage });
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json({ error: "Hiba a frissítés során" }, { status: 500 });
  }
}
