import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
    });

    if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(vendor);
  } catch (error) {
    return NextResponse.json({ error: "Hiba" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { 
      companyName, 
      brandName,
      taxNumber, 
      registrationNumber, 
      zipCode,
      city,
      streetAddress, 
      bankAccountNumber,
      emailNotifications
    } = data;

    const updatedVendor = await prisma.vendor.update({
      where: { userId: session.user.id },
      data: {
        companyName,
        brandName,
        taxNumber,
        registrationNumber,
        zipCode,
        city,
        streetAddress,
        bankAccountNumber,
        emailNotifications: emailNotifications === "true" || emailNotifications === true,
      },
    });

    return NextResponse.json({ message: "Sikeres mentés", vendor: updatedVendor });
  } catch (error) {
    console.error("Profile settings update error:", error);
    return NextResponse.json(
      { error: "Hiba történt a mentés során." },
      { status: 500 }
    );
  }
}
