import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const items = await prisma.campaignItem.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
    });

    // Enrich items with target names
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let targetName = "";
        if (item.targetType === "VENDOR" && item.vendorId) {
          const vendor = await prisma.vendor.findUnique({ where: { id: item.vendorId }, select: { companyName: true, brandName: true } });
          targetName = vendor ? `${vendor.companyName}${vendor.brandName ? ` (${vendor.brandName})` : ""}` : "Ismeretlen gyártó";
        } else if (item.targetType === "CATEGORY" && item.categoryId) {
          const category = await prisma.category.findUnique({ where: { id: item.categoryId }, select: { name: true } });
          targetName = category?.name || "Ismeretlen kategória";
        } else if (item.targetType === "PRODUCT" && item.productId) {
          const product = await prisma.productSync.findUnique({ where: { id: item.productId }, select: { name: true, itemNumber: true } });
          targetName = product ? `${product.name}${product.itemNumber ? ` (${product.itemNumber})` : ""}` : "Ismeretlen termék";
        }
        return { ...item, targetName };
      })
    );

    return NextResponse.json(enrichedItems);
  } catch (error) {
    console.error("Hiba a kampány tételek lekérdezésekor:", error);
    return NextResponse.json({ error: "Nem sikerült lekérdezni a tételeket." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const parseOptionalFloat = (val: any) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const parseOptionalInt = (val: any) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const item = await prisma.campaignItem.create({
      data: {
        campaignId: id,
        targetType: data.targetType,
        vendorId: data.targetType === "VENDOR" ? data.targetId : null,
        categoryId: data.targetType === "CATEGORY" ? data.targetId : null,
        productId: data.targetType === "PRODUCT" ? data.targetId : null,
        discountType: data.discountType || "PERCENTAGE",
        discountValue: parseFloat(data.discountValue),
        customCommissionRate: parseOptionalFloat(data.customCommissionRate),
        maxQuantity: parseOptionalInt(data.maxQuantity),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Hiba a tétel hozzáadásakor:", error);
    return NextResponse.json({ error: "Nem sikerült hozzáadni a tételt." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId szükséges." }, { status: 400 });
    }

    await prisma.campaignItem.delete({ where: { id: itemId, campaignId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hiba a tétel törlésekor:", error);
    return NextResponse.json({ error: "Nem sikerült törölni a tételt." }, { status: 500 });
  }
}
