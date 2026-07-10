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

    const data = await req.json();
    const { draftDescription, draftShortDescription, draftLogoUrl, draftCoverUrl } = data;

    const updatedVendor = await prisma.vendor.update({
      where: { userId: session.user.id },
      data: {
        draftDescription,
        draftShortDescription,
        draftLogoUrl,
        draftCoverUrl,
        brandStatus: "DRAFT"
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: "Márkaoldal frissítve",
        message: "A márkaoldaladat sikeresen elmentettük vázlatként.",
        link: "/dashboard/brand-profile"
      }
    });

    return NextResponse.json({ message: "Márkaoldal sikeresen mentve", vendor: updatedVendor });
  } catch (error) {
    console.error("Brand profile update error:", error);
    return NextResponse.json(
      { error: "Hiba történt a mentés során." },
      { status: 500 }
    );
  }
}
