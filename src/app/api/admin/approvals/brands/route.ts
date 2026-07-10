import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { syncVendorPageToUnas } from "@/lib/unas/pages";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role === "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pendingBrands = await prisma.vendor.findMany({
      where: { brandStatus: "PENDING_APPROVAL" },
      include: { user: true },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(pendingBrands);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role === "VENDOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vendorId, action, rejectReason } = await req.json(); // action: 'APPROVE' or 'REJECT'

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    if (action === "APPROVE") {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          description: vendor.draftDescription,
          shortDescription: vendor.draftShortDescription,
          logoUrl: vendor.draftLogoUrl,
          coverUrl: vendor.draftCoverUrl,
          brandStatus: "PUBLISHED",
          brandRejectReason: null
        }
      });
      
      try {
        await syncVendorPageToUnas(vendorId);
      } catch (syncError: any) {
        console.error("Hiba az UNAS szinkronizáció során:", syncError);
        return NextResponse.json({ message: "Márkaoldal sikeresen publikálva, de az UNAS szinkronizáció sikertelen: " + syncError.message });
      }

      return NextResponse.json({ message: "Márkaoldal sikeresen publikálva és szinkronizálva az UNAS-szal!" });
    } else if (action === "REJECT") {
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          brandStatus: "REJECTED",
          brandRejectReason: rejectReason || "Nem felel meg a minőségi követelményeknek."
        }
      });
      return NextResponse.json({ message: "Márkaoldal elutasítva." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
