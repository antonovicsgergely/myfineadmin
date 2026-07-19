import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    
    // Convert empty strings to null and parse floats
    const parseOptionalFloat = (val: any) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const updatedDiscount = await prisma.vendorDiscount.update({
      where: { id: params.id },
      data: {
        name: data.name,
        vendorId: data.vendorId,
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

    return NextResponse.json(updatedDiscount, { status: 200 });
  } catch (error) {
    console.error("Hiba a kedvezmény szerkesztésekor:", error);
    return NextResponse.json(
      { error: "Nem sikerült szerkeszteni a kedvezményt." },
      { status: 500 }
    );
  }
}
