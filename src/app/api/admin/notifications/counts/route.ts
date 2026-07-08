import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Párhuzamos lekérdezések a hatékonyság érdekében
    const [
      pendingVendors,
      pendingBrands,
      pendingBlogs,
      pendingCategories,
      pendingProducts,
      unassignedProducts
    ] = await Promise.all([
      // 1. Új gyártó regisztrációk (csak admin/superadmin hagyhatja jóvá)
      prisma.vendor.count({ where: { status: "PENDING" } }),
      
      // 2. Márkaoldal jóváhagyások
      prisma.vendor.count({ where: { brandStatus: "PENDING_APPROVAL" } }),
      
      // 3. Blog jóváhagyások
      prisma.blogPost.count({ where: { status: "PENDING_APPROVAL" } }),
      
      // 4. Kategória igénylések
      prisma.categoryRequest.count({ where: { status: "PENDING" } }),
      
      // 5. Termék jóváhagyások (besorolás és minőség)
      prisma.productSync.count({ where: { qualityStatus: "PENDING_APPROVAL" } }),
      
      // 6. Kiosztatlan termékek (UNAS-ból jött, de nincs gyártója)
      prisma.productSync.count({ where: { vendorId: null } })
    ]);

    // Összesítjük a számokat
    const totalCount = 
      pendingVendors + 
      pendingBrands + 
      pendingBlogs + 
      pendingCategories + 
      pendingProducts + 
      unassignedProducts;

    return NextResponse.json({
      totalCount,
      details: {
        pendingVendors,
        pendingBrands,
        pendingBlogs,
        pendingCategories,
        pendingProducts,
        unassignedProducts
      }
    });

  } catch (error) {
    console.error("Failed to fetch notification counts:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
