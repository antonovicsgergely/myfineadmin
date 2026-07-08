import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const { vendorId } = await req.json();
    const resolvedParams = await params;

    if (!vendorId) {
      return NextResponse.json({ error: "Gyártó azonosító (vendorId) megadása kötelező" }, { status: 400 });
    }

    const product = await prisma.productSync.update({
      where: { id: resolvedParams.id },
      data: { 
        vendorId,
        qualityStatus: "APPROVED", // Automatically approve when vendor is assigned
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Vendor assignment error:", error);
    return NextResponse.json({ error: error.message || "Hiba a gyártó hozzárendelésekor" }, { status: 500 });
  }
}
