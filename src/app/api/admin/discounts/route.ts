import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const discounts = await prisma.vendorDiscount.findMany({
      include: { vendor: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error("Hiba a kedvezmények lekérdezésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült lekérdezni a kedvezményeket." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const data = await req.json();
    
    // Convert empty strings to null and parse floats
    const parseOptionalFloat = (val: any) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const newDiscount = await prisma.vendorDiscount.create({
      data: {
        name: data.name || "Egyedi Kedvezmény",
        vendorId: data.vendorId,
        createdById: session?.user?.id || null,
        discountedCommissionRate: parseOptionalFloat(data.discountedCommissionRate),
        discountedPromoCommissionRate: parseOptionalFloat(data.discountedPromoCommissionRate),
        discountedMonthlyFee: parseOptionalFloat(data.discountedMonthlyFee),
        discountedMarketingFee: parseOptionalFloat(data.discountedMarketingFee),
        discountedCardFee: parseOptionalFloat(data.discountedCardFee),
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: { vendor: true, createdBy: true },
    });

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    console.error("Hiba a kedvezmény létrehozásakor:", error);
    return NextResponse.json(
      { error: "Nem sikerült létrehozni a kedvezményt." },
      { status: 500 }
    );
  }
}
