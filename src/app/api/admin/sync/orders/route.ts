import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { syncOrdersFromUnas } from "@/lib/unas/orders";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    // Optional date range from request body
    let dateStart: string | undefined;
    let dateEnd: string | undefined;
    try {
      const body = await req.json();
      dateStart = body.dateStart;
      dateEnd = body.dateEnd;
    } catch {
      // No body provided, use defaults (last 30 days)
    }

    const result = await syncOrdersFromUnas(dateStart, dateEnd);

    return NextResponse.json({
      message: `${result.synced} rendelés sikeresen szinkronizálva.`,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error("Order sync error:", error);
    return NextResponse.json({ error: error.message || "Szinkronizációs hiba" }, { status: 500 });
  }
}
