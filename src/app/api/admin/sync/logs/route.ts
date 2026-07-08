import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const logs = await prisma.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Sync logs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
