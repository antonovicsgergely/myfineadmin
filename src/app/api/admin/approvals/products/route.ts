import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Usually, we'd list products where qualityStatus is PENDING_APPROVAL
    // For now, let's list all DRAFT and PENDING_APPROVAL products to be safe
    const products = await prisma.productSync.findMany({
      where: { qualityStatus: { in: ["PENDING_APPROVAL", "DRAFT"] } },
      include: { vendor: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, action } = await req.json();

    if (action === "APPROVE") {
      const product = await prisma.productSync.update({
        where: { id: productId },
        data: { qualityStatus: "APPROVED" }
      });
      // Sync product to UNAS after approval
      import("@/lib/unas/products").then((mod) => {
        mod.syncProductToUnas(product.id).catch(console.error);
      });
    } else if (action === "REJECT") {
      await prisma.productSync.update({
        where: { id: productId },
        data: { qualityStatus: "REJECTED" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Szerverhiba" }, { status: 500 });
  }
}
