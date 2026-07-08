import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionTier } = await req.json();

    if (!["BASIC", "PRO", "PREMIUM"].includes(subscriptionTier)) {
      return NextResponse.json({ error: "Érvénytelen csomag!" }, { status: 400 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { userId: session.user.id },
      data: { subscriptionTier },
    });

    return NextResponse.json({ message: "Csomag sikeresen módosítva!", tier: updatedVendor.subscriptionTier });
  } catch (error) {
    console.error("Subscription update error:", error);
    return NextResponse.json(
      { error: "Hiba történt a csomag módosításakor." },
      { status: 500 }
    );
  }
}
