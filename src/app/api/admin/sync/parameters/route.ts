import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { syncParametersFromUnas } from "@/lib/unas/parameters";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const result = await syncParametersFromUnas();

    return NextResponse.json({
      message: `${result.synced} paraméter sikeresen szinkronizálva.`,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("Parameter sync error:", error);
    return NextResponse.json({ error: error.message || "Szinkronizációs hiba" }, { status: 500 });
  }
}
