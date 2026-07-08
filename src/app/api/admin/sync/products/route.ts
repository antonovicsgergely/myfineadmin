import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { syncAllProductsToUnas, syncProductsFromUnas } from "@/lib/unas/products";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    // Check direction: "pull" = UNAS→Local, "push" = Local→UNAS (default: both)
    let direction = "both";
    try {
      const body = await req.json();
      direction = body.direction || "both";
    } catch {
      // No body, default to both
    }

    const messages: string[] = [];
    let totalSynced = 0;

    // 1. Pull products FROM UNAS
    if (direction === "pull" || direction === "both") {
      const pullResult = await syncProductsFromUnas();
      messages.push(`⬇️ ${pullResult.synced} termék importálva az UNAS-ból.`);
      totalSynced += pullResult.synced;
      if (pullResult.errors.length > 0) {
        messages.push(`Import hibák: ${pullResult.errors.join(", ")}`);
      }
    }

    // 2. Push local products TO UNAS
    if (direction === "push" || direction === "both") {
      const pushResult = await syncAllProductsToUnas();
      messages.push(`⬆️ ${pushResult.synced} termék szinkronizálva az UNAS-ba (${pushResult.failed} sikertelen).`);
      totalSynced += pushResult.synced;
      if (pushResult.errors.length > 0) {
        messages.push(`Export hibák: ${pushResult.errors.join(", ")}`);
      }
    }

    return NextResponse.json({
      message: messages.join(" | "),
      synced: totalSynced,
    });
  } catch (error: any) {
    console.error("Product sync error:", error);
    return NextResponse.json({ error: error.message || "Szinkronizációs hiba" }, { status: 500 });
  }
}
