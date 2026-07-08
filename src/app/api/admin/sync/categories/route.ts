import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { syncCategoriesFromUnas } from "@/lib/unas/categories";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const result = await syncCategoriesFromUnas();

    return NextResponse.json({
      message: `${result.synced} kategória sikeresen szinkronizálva.`,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("Category sync error:", error);
    return NextResponse.json({ error: error.message || "Szinkronizációs hiba" }, { status: 500 });
  }
}
