import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["SUPERADMIN", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lekérjük az összes terméket a gyártókkal együtt
    const products = await prisma.productSync.findMany({
      include: {
        vendor: {
          select: {
            companyName: true,
            brandName: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Admin products fetch error:", error);
    return NextResponse.json({ error: "Szerverhiba történt a termékek lekérésekor." }, { status: 500 });
  }
}
