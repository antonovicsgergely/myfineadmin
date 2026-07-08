import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { userId: session.user.id },
      data: {
        brandStatus: "PENDING_APPROVAL"
      },
    });

    return NextResponse.json({ message: "Sikeresen beküldve jóváhagyásra!", vendor: updatedVendor });
  } catch (error) {
    console.error("Submit for approval error:", error);
    return NextResponse.json(
      { error: "Hiba történt a beküldés során." },
      { status: 500 }
    );
  }
}
