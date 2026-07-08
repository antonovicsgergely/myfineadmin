import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "VENDOR") {
      return NextResponse.json({ message: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
    });

    if (!vendor) {
      return NextResponse.json({ message: "Gyártó nem található" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      name, shortDescription, description, price, salePrice,
      categoryId, regionId, barcode, imageUrl, uploadMethod, 
      weight, width, height, length,
      statusActive, statusNotPurchasable, statusAdultOnly, statusHidden, statusGiftOnly, 
      statusNew, statusInquiry, statusAutoExport, statusNoDirectDiscount,
      publicFrom, publicTo,
      useInventory, allowBackorder, lowStockThreshold
    } = body;

    // Server-side TEF (Minőségi Szűrő) Validation
    if (!name || typeof price !== "number") {
      return NextResponse.json({ error: "A név és az ár kötelező mezők!" }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ error: "A kép feltöltése kötelező a TEF szabályzat alapján!" }, { status: 400 });
    }
    if (!barcode) {
      return NextResponse.json({ error: "A vonalkód (EAN/GTIN) kötelező!" }, { status: 400 });
    }
    if (!shortDescription || shortDescription.length < 10) {
      return NextResponse.json({ error: "A rövid leírásnak legalább 10 karakter hosszúnak kell lennie!" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "Érvényes kategória megadása kötelező!" }, { status: 400 });
    }
    if (!regionId) {
      return NextResponse.json({ error: "Érvényes régió megadása kötelező!" }, { status: 400 });
    }
    if (!weight || !width || !height || !length) {
      return NextResponse.json({ error: "A szállítási adatok (Súly és Méretek) megadása kötelező!" }, { status: 400 });
    }

    // Auto-generate itemNumber
    const generatedItemNumber = `MF-${vendor.id.substring(0,4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    const product = await prisma.productSync.create({
      data: {
        vendorId: vendor.id,
        name,
        shortDescription,
        description,
        itemNumber: generatedItemNumber,
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : null,
        
        weight: Number(weight),
        width: Number(width),
        height: Number(height),
        length: Number(length),
        
        statusActive, statusNotPurchasable, statusAdultOnly, statusHidden, statusGiftOnly, 
        statusNew, statusInquiry, statusAutoExport, statusNoDirectDiscount,
        
        publicFrom: publicFrom ? new Date(publicFrom) : null,
        publicTo: publicTo ? new Date(publicTo) : null,
        
        useInventory, 
        allowBackorder, 
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : null,
        
        categoryId,
        regionId,
        barcode,
        imageUrl,
        uploadMethod: uploadMethod || "MANUAL",
        syncStatus: "PENDING",
        qualityStatus: "DRAFT" 
      },
    });

    // We might not want to start Unas sync immediately if it needs Admin approval first.
    // For now, we'll wait for admin approval if qualityStatus is pending. Let's just create it as DRAFT.
    // import("@/lib/unas").then((unas) => {
    //   unas.syncProductToUnas(product.id).catch(console.error);
    // });

    return NextResponse.json(
      { message: "Termék sikeresen hozzáadva! Vár a központi minőség-ellenőrzésre.", product },
      { status: 201 }
    );
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { message: "Hiba történt a termék létrehozásakor." },
      { status: 500 }
    );
  }
}
