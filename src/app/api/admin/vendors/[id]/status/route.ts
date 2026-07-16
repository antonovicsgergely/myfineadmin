import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "Jogosulatlan hozzáférés" }, { status: 401 });
    }

    const { status } = await req.json();
    const resolvedParams = await params;

    if (!status || !["APPROVED", "REJECTED", "PENDING", "SUSPENDED"].includes(status)) {
      return NextResponse.json({ message: "Érvénytelen státusz" }, { status: 400 });
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: resolvedParams.id },
      data: { status },
      include: { user: { select: { email: true, name: true } } },
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Vendor status update error:", error);
    return NextResponse.json(
      { message: "Hiba történt a státusz frissítésekor." },
      { status: 500 }
    );
  }
}
