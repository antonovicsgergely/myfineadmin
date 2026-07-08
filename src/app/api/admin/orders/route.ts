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

    const orders = await prisma.order.findMany({
      include: {
        items: true,
      },
      orderBy: { orderDate: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
